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
  Submit details of lost or found items with descriptions, images, and location.

- **Track Items**  
  Monitor the status of your reports and receive updates on matches or claims.

- **Claim Process**  
  Secure and verified claiming process for found items.

- **User-Friendly Interface**  
  Intuitive UI for seamless experience across web and mobile platforms.

- **Notifications**  
  Get real-time alerts for item matches, claim approvals, and status changes.

- **Admin Dashboard**  
  Tools for campus staff to manage reports, verify claims, and communicate with users.

---

## 🛠 Installation

To set up **CampusFound** locally, follow these steps:

### 1. Clone the Repository

```bash
git clone https://github.com/sujitwagh9/CampusFound.git
cd CampusFound
```

### 2. Install Dependencies

Ensure you have **Node.js** and **npm** installed. Then run:

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the backend directory and add the necessary configurations:

```env
PORT = 8080
MONGODB_URL=your_mongoDB_url

JWT_SECRET=""
JWT_EXPIRE_IN=15m

JWT_REFRESH_SECRET=""
JWT_REFRESH_EXPIRE_IN=7d

EMAIL_PASS=generated_pass
EMAIL_USER=your_mail_id
```

### 4. Run the Application

frontend folder
```bash
npm run dev
```

backend folder
```bash
npm start
```

The app will be available at [http://localhost:5173](http://localhost:5173)

---

## 📖 Usage

1. **Register/Login**  
   Create an account or log in using your campus credentials.

2. **Report an Item**  
   Go to the **Explore** section, choose "Lost" or "Found," and fill in the item details.

3. **Track Reports**  
   View all your reported items and check their statuses in the **Dashboard** section.

4. **Claim Items**  
   Browse the found items and submit a claim with verification.

5. **Admin Features**  
   Admins can log in to the dashboard to manage reports, verify claims, and send notifications.

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