# 🎓 CampusFound

**CampusFound** is a user-friendly web application designed to streamline the process of reporting, tracking, and claiming lost or found items within a college or university campus. It provides an efficient solution for students, staff, and administrators to manage belongings, reduce the hassle of misplaced items, and foster a connected campus community.

---

## 📚 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🚀 Features

- **Report Lost/Found Items**  
  Submit details of lost or found items with a category, campus location and up to 3 photos.

- **Search & Filter**  
  Find items by keyword, type, category and status, with shareable filter links.

- **Smart Matching**  
  When a found item is reported, owners of similar lost reports are emailed automatically, and every item page shows its possible matches.

- **Verified Claims**  
  Claimants describe details only the owner would know; an admin reviews each claim before it is approved.

- **Track Everything**  
  Your dashboard lists your reported items (edit, mark resolved, delete) and the status of your claims.

- **Admin Tools**  
  Review claims with proof and item details, see stats, manage users and roles, and export users to CSV.

---

## 🛠 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/sujitwagh9/CampusFound.git
cd CampusFound
```

### 2. Install Dependencies

Ensure you have **Node.js 20+** and **npm** installed. The backend and frontend are separate packages:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Set Up Environment Variables

Create `backend/.env`:

```env
PORT=8080
MONGODB_URL=your_mongoDB_url
FRONTEND_URL=http://localhost:5173   # used for CORS and links in emails

JWT_SECRET=a_long_random_string
JWT_EXPIRE_IN=15m
JWT_REFRESH_SECRET=another_long_random_string
JWT_REFRESH_EXPIRE_IN=7d

EMAIL_USER=your_mail_id              # Gmail address used to send notifications
EMAIL_PASS=generated_app_password

# Optional: enable photo uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional: only allow signups from campus email domains
ALLOWED_EMAIL_DOMAINS=college.edu
```

Create `frontend/.env` (see `frontend/.env.example`):

```env
VITE_API_URL=http://localhost:8080/api
```

### 4. Run the Application

backend folder
```bash
npm run dev     # or: npm start
```

frontend folder
```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173)

### 5. Create the First Admin

For security, signup always creates regular users. Sign up normally, then promote your account from the backend folder:

```bash
npm run make-admin -- you@college.edu
```

Further admins can be promoted from the **Users** page.

### 6. Run the Tests

```bash
cd backend && npm test
```

The API tests run against an in-memory MongoDB, so no database setup is needed.

---

## 📖 Usage

1. **Register/Login**  
   Create an account or log in using your campus credentials.

2. **Report an Item**  
   Click **Report item**, choose "Lost" or "Found", and fill in the details. You'll see any possible matches straight away.

3. **Track Reports**  
   View your reported items and claims in **My items**. Mark an item resolved once it's back with its owner.

4. **Claim Items**  
   Find your item on **Explore**, click **This is mine**, and describe something only the owner would know.

5. **Admin Features**  
   Admins review pending claims (with the claimant's proof), approve or reject them, and manage users.

---

## 🤝 Contributing

We welcome contributions to enhance **CampusFound**! To contribute:

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes and commit:
   ```bash
   git commit -m "Add your feature"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a **Pull Request** with a detailed description.

> ⚠️ Please ensure your code follows the project’s coding standards and includes relevant tests.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 📬 Contact

For any questions, suggestions, or support:

- **Sujit Wagh** – [sujitwagh1233@gmail.com](mailto:sujitwagh1233@gmail.com)
- **GitHub Issues** – [Create an issue](https://github.com/sujitwagh9/CampusFound/issues)

---

> Thank you for using **CampusFound**!  
> Let’s make campus life easier, one found item at a time.