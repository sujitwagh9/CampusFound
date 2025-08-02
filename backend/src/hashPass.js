import bcrypt from 'bcrypt';

const password = 'VIT@1233';
bcrypt.hash(password, 10, (err, hash) => {
  if (err) throw err;
  console.log('Hashed Password:', hash);
});
