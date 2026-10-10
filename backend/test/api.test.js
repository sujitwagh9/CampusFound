import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod, app, User;

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URL = mongod.getUri();
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
  // Imported after the environment is set, since config reads it on load
  app = (await import('../src/app.js')).default;
  User = (await import('../src/models/user.model.js')).User;
  await mongoose.connect(process.env.MONGODB_URL);
  await mongoose.model('Item').syncIndexes();
  await mongoose.model('User').syncIndexes();
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

const api = () => request(app);
const auth = (token) => ({ Authorization: `Bearer ${token}` });

const signup = async (username) => {
  const res = await api()
    .post('/api/signup')
    .send({ username, email: `${username}@campus.edu`, password: 'password123' });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body;
};

const makeAdmin = async (username) => {
  await User.updateOne({ username }, { role: 'admin' });
  const res = await api().post('/api/login').send({ email: `${username}@campus.edu`, password: 'password123' });
  return res.body;
};

const reportItem = (token, overrides = {}) =>
  api()
    .post('/api/items')
    .set(auth(token))
    .send({
      type: 'found',
      title: 'Black leather wallet',
      description: 'Black wallet with a student card inside',
      category: 'Accessories',
      location: 'Library 2nd floor',
      ...overrides,
    });

test('signup ignores a client-supplied admin role', async () => {
  const res = await api()
    .post('/api/signup')
    .send({ username: 'mallory', email: 'mallory@campus.edu', password: 'password123', role: 'admin' });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.role, 'user');
});

test('signup validates input', async () => {
  const res = await api().post('/api/signup').send({ username: 'x', email: 'bad', password: '1' });
  assert.equal(res.status, 400);
  assert.ok(res.body.errors.length >= 3);
});

test('login does not reveal whether an email exists', async () => {
  await signup('alice');
  const unknown = await api().post('/api/login').send({ email: 'nobody@campus.edu', password: 'password123' });
  const wrong = await api().post('/api/login').send({ email: 'alice@campus.edu', password: 'wrongpass1' });
  assert.equal(unknown.status, 401);
  assert.equal(wrong.status, 401);
  assert.equal(unknown.body.message, wrong.body.message);
});

test('forgot-password responds the same for unknown emails', async () => {
  const known = await api().post('/api/forgot-password').send({ email: 'alice@campus.edu' });
  const unknown = await api().post('/api/forgot-password').send({ email: 'nobody@campus.edu' });
  assert.equal(known.status, 200);
  assert.deepEqual(known.body, unknown.body);
});

test('refresh tokens rotate and are revoked on logout', async () => {
  const { refreshToken } = await signup('bob');
  const refreshed = await api().post('/api/refresh').send({ refreshToken });
  assert.equal(refreshed.status, 200);

  const reused = await api().post('/api/refresh').send({ refreshToken });
  assert.equal(reused.status, 401, 'a rotated refresh token must not be reusable');

  await api().post('/api/logout').send({ refreshToken: refreshed.body.refreshToken });
  const afterLogout = await api().post('/api/refresh').send({ refreshToken: refreshed.body.refreshToken });
  assert.equal(afterLogout.status, 401);
});

test('expired/invalid access tokens get 401, not 403', async () => {
  const res = await api().get('/api/user/items').set(auth('garbage'));
  assert.equal(res.status, 401);
});

test('item creation validates category and strips forbidden fields', async () => {
  const { accessToken } = await signup('carol');
  const bad = await reportItem(accessToken, { category: '' });
  assert.equal(bad.status, 400);

  const ok = await reportItem(accessToken, { type: 'Found', status: 'claimed', reportedBy: '000000000000000000000000' });
  assert.equal(ok.status, 201, JSON.stringify(ok.body));
  assert.equal(ok.body.item.type, 'found');
  assert.equal(ok.body.item.status, 'pending');
});

test('owners cannot mass-assign protected fields on update', async () => {
  const { accessToken } = await signup('dave');
  const { body } = await reportItem(accessToken);
  const res = await api()
    .patch(`/api/items/${body.item._id}`)
    .set(auth(accessToken))
    .send({ title: 'Brown leather wallet', status: 'claimed', reportedBy: '000000000000000000000000' });
  assert.equal(res.status, 400, 'status "claimed" is not allowed for owners');

  const ok = await api()
    .patch(`/api/items/${body.item._id}`)
    .set(auth(accessToken))
    .send({ title: 'Brown leather wallet', reportedBy: '000000000000000000000000' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.item.title, 'Brown leather wallet');
  assert.equal(ok.body.item.reportedBy.username, 'dave');
});

test('public item list hides reporter emails and supports filters', async () => {
  const res = await api().get('/api/items?type=found&q=wallet');
  assert.equal(res.status, 200);
  assert.ok(res.body.items.length > 0);
  for (const item of res.body.items) {
    assert.equal(item.reportedBy.email, undefined);
    assert.equal(item.type, 'found');
  }
  assert.ok(res.body.total >= res.body.items.length);
});

test('claim workflow: proof required, reject releases item, approve claims it', async () => {
  const finder = await signup('finder');
  const owner = await signup('owner');
  const other = await signup('other');
  const admin = await makeAdmin('alice');

  const { body } = await reportItem(finder.accessToken, { title: 'Blue water bottle', description: 'Steel bottle with stickers' });
  const itemId = body.item._id;

  const noProof = await api().post(`/api/items/${itemId}/claim-request`).set(auth(other.accessToken)).send({});
  assert.equal(noProof.status, 400);

  const own = await api()
    .post(`/api/items/${itemId}/claim-request`)
    .set(auth(finder.accessToken))
    .send({ message: 'It has a sticker of a cat on it' });
  assert.equal(own.status, 400);

  const claim1 = await api()
    .post(`/api/items/${itemId}/claim-request`)
    .set(auth(other.accessToken))
    .send({ message: 'It has a sticker of a cat on it' });
  assert.equal(claim1.status, 201);

  const dup = await api()
    .post(`/api/items/${itemId}/claim-request`)
    .set(auth(owner.accessToken))
    .send({ message: 'It has my name engraved on the bottom' });
  assert.equal(dup.status, 409, 'item is under review');

  const nonAdmin = await api().get('/api/admin/claim-requests').set(auth(other.accessToken));
  assert.equal(nonAdmin.status, 403);

  const reject = await api()
    .post(`/api/admin/claim-requests/${claim1.body.claim._id}`)
    .set(auth(admin.accessToken))
    .send({ action: 'reject' });
  assert.equal(reject.status, 200);

  const afterReject = await api().get(`/api/items/${itemId}`);
  assert.equal(afterReject.body.item.status, 'pending', 'rejected claim must release the item');

  const retry = await api()
    .post(`/api/items/${itemId}/claim-request`)
    .set(auth(other.accessToken))
    .send({ message: 'Trying again with the same story' });
  assert.equal(retry.status, 400, 'rejected claimant cannot re-claim');

  const claim2 = await api()
    .post(`/api/items/${itemId}/claim-request`)
    .set(auth(owner.accessToken))
    .send({ message: 'It has my name engraved on the bottom' });
  assert.equal(claim2.status, 201);

  const approve = await api()
    .post(`/api/admin/claim-requests/${claim2.body.claim._id}`)
    .set(auth(admin.accessToken))
    .send({ action: 'approve' });
  assert.equal(approve.status, 200);

  const final = await api().get(`/api/items/${itemId}`).set(auth(owner.accessToken));
  assert.equal(final.body.item.status, 'claimed');
  assert.equal(final.body.myClaim.status, 'approved');

  const myClaims = await api().get('/api/user/claims').set(auth(owner.accessToken));
  assert.equal(myClaims.body.length, 1);
});

test('reporting a found item returns matching lost reports', async () => {
  const loser = await signup('loser');
  const finder = await signup('finder2');
  await reportItem(loser.accessToken, {
    type: 'lost',
    title: 'Lost silver laptop charger',
    description: 'Dell laptop charger left in lab',
    category: 'Electronics',
  });
  const found = await reportItem(finder.accessToken, {
    title: 'Laptop charger found',
    description: 'Dell charger found in the computer lab',
    category: 'Electronics',
  });
  assert.equal(found.status, 201);
  assert.equal(found.body.matches.length, 1);
  assert.equal(found.body.matches[0].title, 'Lost silver laptop charger');
});

test('admins cannot delete themselves; deleting a user removes their items', async () => {
  const admin = await makeAdmin('alice');
  const self = await api().delete(`/api/admin/users/${admin.user.id}`).set(auth(admin.accessToken));
  assert.equal(self.status, 400);

  const victim = await signup('victim');
  await reportItem(victim.accessToken, { title: 'Victim umbrella', description: 'Red umbrella with a wooden handle' });
  const del = await api().delete(`/api/admin/users/${victim.user.id}`).set(auth(admin.accessToken));
  assert.equal(del.status, 200);

  const items = await api().get('/api/items?q=Victim umbrella');
  assert.equal(items.body.total, 0);
});

test('demoted admins lose access immediately', async () => {
  const admin = await makeAdmin('alice');
  const target = await signup('tempadmin');
  await api().patch(`/api/admin/users/${target.user.id}/role`).set(auth(admin.accessToken)).send({ role: 'admin' });
  const promoted = await api().post('/api/login').send({ email: 'tempadmin@campus.edu', password: 'password123' });
  assert.equal((await api().get('/api/admin/stats').set(auth(promoted.body.accessToken))).status, 200);

  await api().patch(`/api/admin/users/${target.user.id}/role`).set(auth(admin.accessToken)).send({ role: 'user' });
  assert.equal((await api().get('/api/admin/stats').set(auth(promoted.body.accessToken))).status, 403);
});

test('a single shared word is not reported as a match', async () => {
  const finder = await signup('finder3');
  const loser = await signup('loser3');
  await reportItem(loser.accessToken, {
    type: 'lost',
    title: 'Black HP charger',
    description: 'Charger with blue tape on the cable',
    category: 'Electronics',
  });
  const found = await reportItem(finder.accessToken, {
    title: 'Blue Milton water bottle',
    description: 'Steel bottle with stickers, left near the canteen',
    category: 'Other',
  });
  assert.equal(found.status, 201);
  // Shares only the word "blue" with the lost charger
  assert.equal(found.body.matches.length, 0);
});

test('tests can never send real email', async () => {
  const { config } = await import('../src/config.js');
  assert.equal(config.mail.disabled, true);
});

test('profile: rename, change password, sign out everywhere', async () => {
  const me = await signup('profiler');
  await signup('takenname');

  const taken = await api().patch('/api/profile').set(auth(me.accessToken)).send({ username: 'TakenName' });
  assert.equal(taken.status, 409);

  const renamed = await api().patch('/api/profile').set(auth(me.accessToken)).send({ username: 'profiler2', role: 'admin' });
  assert.equal(renamed.status, 200);
  assert.equal(renamed.body.user.username, 'profiler2');
  assert.equal(renamed.body.user.role, 'user', 'role cannot be changed through the profile');

  const wrong = await api()
    .post('/api/profile/password')
    .set(auth(me.accessToken))
    .send({ currentPassword: 'nope12345', newPassword: 'newpassword1' });
  assert.equal(wrong.status, 400);

  const changed = await api()
    .post('/api/profile/password')
    .set(auth(me.accessToken))
    .send({ currentPassword: 'password123', newPassword: 'newpassword1' });
  assert.equal(changed.status, 200);
  assert.ok(changed.body.refreshToken, 'this device gets a fresh session');

  const oldSession = await api().post('/api/refresh').send({ refreshToken: me.refreshToken });
  assert.equal(oldSession.status, 401, 'other sessions are revoked after a password change');

  const login = await api().post('/api/login').send({ email: 'profiler@campus.edu', password: 'newpassword1' });
  assert.equal(login.status, 200);

  await api().post('/api/logout-all').set(auth(login.body.accessToken));
  const afterAll = await api().post('/api/refresh').send({ refreshToken: login.body.refreshToken });
  assert.equal(afterAll.status, 401);
});

test('every action the user takes is confirmed by email (and the opt-out works)', async () => {
  const { outbox } = await import('../src/utils/mail.utils.js');
  const subjectsFor = (email, since) => outbox.slice(since).filter((m) => m.to === email).map((m) => m.subject);

  let mark = outbox.length;
  const me = await signup('mailer');
  const email = 'mailer@campus.edu';
  assert.deepEqual(subjectsFor(email, mark), ['Welcome to CampusFound']);

  mark = outbox.length;
  const { body } = await reportItem(me.accessToken, { title: 'Red umbrella', description: 'Folding umbrella with wooden handle' });
  const itemId = body.item._id;
  await api().patch(`/api/items/${itemId}`).set(auth(me.accessToken)).send({ location: 'Main Gate' });
  await api().patch(`/api/items/${itemId}`).set(auth(me.accessToken)).send({ status: 'resolved' });
  await api().patch(`/api/items/${itemId}`).set(auth(me.accessToken)).send({ status: 'pending' });
  await api().delete(`/api/items/${itemId}`).set(auth(me.accessToken));
  assert.deepEqual(subjectsFor(email, mark), [
    'You reported "Red umbrella" as found',
    'You updated "Red umbrella"',
    '"Red umbrella" marked as resolved',
    '"Red umbrella" reopened',
    'You deleted "Red umbrella"',
  ]);
  assert.match(outbox.find((m) => m.subject === 'You updated "Red umbrella"').text, /You changed: location/);

  mark = outbox.length;
  const finder = await signup('mailfinder');
  const found = await reportItem(finder.accessToken, { title: 'Green notebook', description: 'Spiral notebook with chemistry notes' });
  await api()
    .post(`/api/items/${found.body.item._id}/claim-request`)
    .set(auth(me.accessToken))
    .send({ message: 'My name is on the first page' });
  assert.ok(subjectsFor(email, mark).includes('Your claim for "Green notebook" was sent'));

  mark = outbox.length;
  await api().patch('/api/profile').set(auth(me.accessToken)).send({ username: 'mailer2' });
  const pw = await api()
    .post('/api/profile/password')
    .set(auth(me.accessToken))
    .send({ currentPassword: 'password123', newPassword: 'password456' });
  await api().post('/api/logout-all').set(auth(pw.body.accessToken));
  assert.deepEqual(subjectsFor(email, mark), [
    'Your username was changed',
    'Your CampusFound password was changed',
    'You were signed out of all devices',
  ]);

  // Opting out stops activity emails but never security notices
  const login = await api().post('/api/login').send({ email, password: 'password456' });
  const optOut = await api().patch('/api/profile').set(auth(login.body.accessToken)).send({ emailActivity: false });
  assert.equal(optOut.body.user.emailActivity, false);
  mark = outbox.length;
  await reportItem(login.body.accessToken, { title: 'Blue scarf', description: 'Woollen scarf left in the auditorium' });
  await api().post('/api/logout-all').set(auth(login.body.accessToken));
  assert.deepEqual(subjectsFor(email, mark), ['You were signed out of all devices']);
});

test('matching understands synonyms and explains why', async () => {
  const loser = await signup('specsowner');
  const finder = await signup('specsfinder');
  await reportItem(loser.accessToken, { type: 'lost', title: 'Lost specs', description: 'Thin metal frame', category: 'Accessories' });
  const found = await reportItem(finder.accessToken, { title: 'Spectacles found', description: 'Gold rimmed pair', category: 'Accessories' });
  assert.equal(found.body.matches.length, 1, 'specs ↔ spectacles should match');
  assert.ok(found.body.matches[0].match.reasons.includes('Same place'));
});

test('matches in the same place rank higher', async () => {
  const loser = await signup('rankowner');
  const f1 = await signup('rankfinder1');
  const f2 = await signup('rankfinder2');
  const desc = 'Silver Casio calculator with a cracked solar panel';
  await reportItem(f1.accessToken, { title: 'Casio calculator', description: desc, category: 'Electronics', location: 'Sports complex' });
  await reportItem(f2.accessToken, { title: 'Casio calculator', description: desc, category: 'Electronics', location: 'Physics lab' });
  const lost = await reportItem(loser.accessToken, { type: 'lost', title: 'Casio calculator', description: desc, category: 'Electronics', location: 'Physics lab, 1st floor' });
  assert.equal(lost.body.matches.length, 2);
  assert.equal(lost.body.matches[0].location, 'Physics lab');
  assert.ok(lost.body.matches[0].match.score > lost.body.matches[1].match.score);
});

test('finders hear about lost reports that match what they found', async () => {
  const { outbox } = await import('../src/utils/mail.utils.js');
  const finder = await signup('earfinder');
  const loser = await signup('earowner');
  await reportItem(finder.accessToken, { title: 'White earbuds case', description: 'Charging case with one earbud inside', category: 'Electronics' });
  const mark = outbox.length;
  await reportItem(loser.accessToken, { type: 'lost', title: 'Lost my airpods', description: 'White charging case, one earbud missing', category: 'Electronics' });
  const mail = outbox.slice(mark).find((m) => m.to === 'earfinder@campus.edu');
  assert.ok(mail, 'finder should be emailed');
  assert.match(mail.subject, /Someone may have lost the "White earbuds case" you found/);
});

test('approving a claim closes the claimant’s own lost report', async () => {
  const { outbox } = await import('../src/utils/mail.utils.js');
  const admin = await makeAdmin('alice');
  const owner = await signup('walletowner');
  const finder = await signup('walletfinder');

  // Auto-linked: the claimant doesn't say which lost report it is
  const lost = await reportItem(owner.accessToken, { type: 'lost', title: 'Brown leather wallet', description: 'Brown wallet with my metro card', category: 'Accessories' });
  const found = await reportItem(finder.accessToken, { title: 'Leather wallet found', description: 'Brown leather wallet, metro card inside', category: 'Accessories' });
  const claim = await api()
    .post(`/api/items/${found.body.item._id}/claim-request`)
    .set(auth(owner.accessToken))
    .send({ message: 'The metro card has my photo on it' });
  assert.equal(claim.body.claim.lostItem, lost.body.item._id, 'claim is linked to the owner’s lost report');

  const mark = outbox.length;
  await api().post(`/api/admin/claim-requests/${claim.body.claim._id}`).set(auth(admin.accessToken)).send({ action: 'approve' });
  const lostAfter = await api().get(`/api/items/${lost.body.item._id}`);
  assert.equal(lostAfter.body.item.status, 'resolved', 'lost report closes automatically');
  const decision = outbox.slice(mark).find((m) => m.to === 'walletowner@campus.edu');
  assert.match(decision.text, /also marked your lost report/);

  // Explicitly linked via lostItemId (the "Is this yours?" button)
  const lost2 = await reportItem(owner.accessToken, { type: 'lost', title: 'Black umbrella', description: 'Folding umbrella with a bent spoke', category: 'Other' });
  const found2 = await reportItem(finder.accessToken, { title: 'Umbrella', description: 'Black folding umbrella', category: 'Other' });
  const claim2 = await api()
    .post(`/api/items/${found2.body.item._id}/claim-request`)
    .set(auth(owner.accessToken))
    .send({ message: 'One spoke is bent near the handle', lostItemId: lost2.body.item._id });
  assert.equal(claim2.body.claim.lostItem, lost2.body.item._id);

  // Someone else's report can't be linked
  const other = await signup('walletother');
  const found3 = await reportItem(finder.accessToken, { title: 'Grey hoodie', description: 'Grey hoodie with a college logo', category: 'Clothing' });
  const claim3 = await api()
    .post(`/api/items/${found3.body.item._id}/claim-request`)
    .set(auth(other.accessToken))
    .send({ message: 'It has my initials on the tag', lostItemId: lost2.body.item._id });
  assert.equal(claim3.body.claim.lostItem, null);
});

test('sign in with Google: create, sign in again, link safely, reject bad tokens', async () => {
  const { google } = await import('../src/services/google.service.js');
  const { outbox } = await import('../src/utils/mail.utils.js');
  const original = google.verifyIdToken;
  // Fake Google: the "token" is just a key into these profiles
  const profiles = {
    'token-new-user-0000000000': { sub: 'g-111', email: 'Asha.Rao@campus.edu', email_verified: true, name: 'Asha Rao' },
    'token-existing-00000000000': { sub: 'g-222', email: 'prelinked@campus.edu', email_verified: true, name: 'Pre Linked' },
    'token-unverified-000000000': { sub: 'g-333', email: 'nover@campus.edu', email_verified: false, name: 'No Ver' },
  };
  google.verifyIdToken = async (t) => {
    if (!profiles[t]) throw new Error('invalid token');
    return profiles[t];
  };
  try {
    // New user
    const first = await api().post('/api/auth/google').send({ credential: 'token-new-user-0000000000' });
    assert.equal(first.status, 201);
    assert.equal(first.body.created, true);
    assert.equal(first.body.user.username, 'asha.rao');
    assert.equal(first.body.user.email, 'asha.rao@campus.edu');
    assert.equal(first.body.user.hasPassword, false);
    assert.equal(first.body.user.googleLinked, true);
    assert.equal(first.body.user.role, 'user');

    // Same Google account again: signs in, no duplicate
    const again = await api().post('/api/auth/google').send({ credential: 'token-new-user-0000000000' });
    assert.equal(again.status, 200);
    assert.equal(again.body.user.id, first.body.user.id);

    // Google users can set a first password without a current one
    const set = await api()
      .post('/api/profile/password')
      .set(auth(again.body.accessToken))
      .send({ newPassword: 'mypassword1' });
    assert.equal(set.status, 200);
    assert.equal(set.body.user.hasPassword, true);
    const pwLogin = await api().post('/api/login').send({ email: 'asha.rao@campus.edu', password: 'mypassword1' });
    assert.equal(pwLogin.status, 200);

    // Existing password account (possibly registered by someone else): linking
    // clears the old password and ends its sessions
    const squatter = await signup('prelinked');
    const mark = outbox.length;
    const linked = await api().post('/api/auth/google').send({ credential: 'token-existing-00000000000' });
    assert.equal(linked.status, 200);
    assert.equal(linked.body.linked, true);
    assert.equal(linked.body.user.id, squatter.user.id);
    const oldPassword = await api().post('/api/login').send({ email: 'prelinked@campus.edu', password: 'password123' });
    assert.equal(oldPassword.status, 401, 'old password no longer works');
    const oldSession = await api().post('/api/refresh').send({ refreshToken: squatter.refreshToken });
    assert.equal(oldSession.status, 401, 'old sessions are revoked');
    assert.ok(outbox.slice(mark).some((m) => m.subject === 'Google sign-in was added to your account'));

    // Unverified Google email and forged tokens are refused
    assert.equal((await api().post('/api/auth/google').send({ credential: 'token-unverified-000000000' })).status, 401);
    assert.equal((await api().post('/api/auth/google').send({ credential: 'forged-token-xxxxxxxxxxxx' })).status, 401);

    // Password accounts still need their current password to change it
    const needsCurrent = await api()
      .post('/api/profile/password')
      .set(auth(pwLogin.body.accessToken))
      .send({ newPassword: 'another123' });
    assert.equal(needsCurrent.status, 400);
  } finally {
    google.verifyIdToken = original;
  }
});

test('the real verifier rejects tokens that are not from Google', async () => {
  const { google } = await import('../src/services/google.service.js');
  await assert.rejects(google.verifyIdToken('not-a-real-google-token'));
});
