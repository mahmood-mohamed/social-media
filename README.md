# Connectly Backend 🚀

Connectly is a smart, scalable, and realistic social media backend application designed to mimic modern popular social platforms. Built using **Node.js**, **Express**, **TypeScript**, and **MongoDB (Mongoose)**, it features secure authentication, social connections, real-time messaging, post and comment management, and robust media uploads.

---

## 🌟 Key Features

* **Secure Authentication & Authorization**
  * Email-based signup and login with hashed passwords via `bcryptjs`.
  * Multi-token strategy using **JWT Access & Refresh Tokens** with cookie support.
  * Integration with **Google OAuth** for social sign-ins.
* **Social Connections (Friends System)**
  * Send, accept, reject, or cancel friend requests.
  * Optimized friendship querying using duplicate records (storing both directions for faster lookups).
  * Direct blocking system (deletes existing friendships and prevents interactions).
* **Content Management**
  * Create, update, read, and delete posts.
  * Image attachments support for posts, comments, and user profiles.
  * Threaded commenting system.
* **Real-time Capabilities**
  * Real-time messaging and chat powered by **Socket.IO**.
* **Cloud Media Uploads**
  * Integrated with **Cloudinary** for scalable profile pictures and media storage.
  * Local temporary caching with automated cleanup.
  * Size and MIME-type restrictions via `multer` for secure uploads.
* **Robust Core**
  * Request validation using **Zod**.
  * Dynamic environment config loader.
  * Unified error-handling middleware.
  * Email notifications and transactional emails with **Nodemailer**.

---

## 📁 Project Structure

```text
backend/
├── src/
│   ├── DB/               # Database connection and models
│   ├── config/           # Environment configuration files
│   ├── middleware/       # JWT auth, validation, and error handlers
│   ├── modules/          # Business logic folders grouped by feature
│   │   ├── auth/         # Login, Registration, Google OAuth, Refresh Tokens
│   │   ├── user/         # Profiles & user-specific settings
│   │   ├── post/         # Posts management & feed
│   │   ├── comment/      # Comments management
│   │   ├── friends/      # Friend requests, friendships, and blocking
│   │   ├── chat/         # Message storage and conversation threads
│   │   └── admin/        # Administration routes
│   ├── socket-io/        # Socket.IO event setup & handlers
│   ├── types/            # TypeScript declaration files
│   ├── utils/            # Shared utilities (AppError, email helper, etc.)
│   ├── app.controller.ts # Bootstraps middleware, routers, and DB connections
│   └── index.ts          # Server entry point
├── uploads/              # Temporary uploads folder
├── .env.example          # Environment variables template
├── tsconfig.json         # TypeScript configurations
├── package.json          # Node dependencies and scripts
└── README.md             # Documentation
```

---

## ⚙️ Environment Configuration

Copy the template from `.env.example` to a new `.env` file in the root of the backend folder:

```bash
cp .env.example .env
```

Fill in the following variables:

```ini
# Database
DB_URL=mongodb://localhost:27017/connectly # Your MongoDB Connection URI

# Server
PORT=5000

# Email (Transactional emails via Gmail App Password)
EMAIL_USERNAME=your_gmail@gmail.com
EMAIL_PASSWORD=your_app_password

# JWT Secrets
ACCESS_TOKEN_SECRET=your_jwt_access_secret_key
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Default Avatars
DEFAULT_AVATAR_MALE_URL=https://res.cloudinary.com/example/male.png
DEFAULT_AVATAR_FEMALE_URL=https://res.cloudinary.com/example/female.png

# Client
CLIENT_URL=http://localhost:3000
```

---

## 🛠️ Getting Started

### 1. Prerequisites

Make sure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18.x or above)
* [MongoDB](https://www.mongodb.com/) (Local server or MongoDB Atlas URI)

### 2. Install Dependencies

In the `backend` directory, run:

```bash
npm install
```

### 3. Run Development Server

To run the project in watch-mode with dynamic TypeScript recompilation, use:

```bash
npm run start:dev
```

This starts:
1. `tsc --watch` for transpiling TypeScript files to `/dist`.
2. `node --watch dist/index.js` to automatically reload the Express server upon changes.

The API will be available at `http://localhost:<PORT>`.

---

## 👥 Friends & Social Relationship Flow

| Model | Purpose | Notes |
| :--- | :--- | :--- |
| **FriendRequest** | Manages friend requests between users | Tracks `pending`, `accepted`, and `rejected` states |
| **Friendship** | Stores accepted friendships | Dual-records pattern (stored twice for fast queries) |
| **BlockedUser** | Stores block relationships | Single-record pattern (unidirectional) |

---

## 🔌 API Endpoints Reference

### 🔐 Authentication (`/auth`)

All routes under `/auth` are public except `/logout`.

* `POST /auth/register` — Create a new user account (Requires registration validation).
* `POST /auth/verify-account` — Verify user account using OTP code.
* `POST /auth/resend-otp` — Resend verification OTP code to user's email.
* `POST /auth/login` — Authenticate user via email & password.
* `POST /auth/confirm-login` — Complete 2FA login verification using OTP.
* `POST /auth/google-login` — Sign in or register via Google OAuth.
* `POST /auth/forgot-password` — Request a password reset OTP code.
* `POST /auth/reset-password` — Set a new password using the reset OTP code.
* `POST /auth/refresh-token` — Regenerate access tokens using the refresh token.
* `POST /auth/logout` — Revoke session and log out the user *(Requires Authentication)*.

---

### 👤 User Management (`/user`)

All routes below require the user to be authenticated.

* `GET /user/me` — Fetch currently logged-in user's profile details.
* `GET /user/search` — Search users by name query (first, last, or full name).
* `GET /user/:id` — Fetch public profile info of another user by ID.
* `PATCH /user/update-profile-picture` — Update user profile picture (Accepts single image via Cloudinary).
* `PATCH /user/update-password` — Change password for the logged-in user.
* `POST /user/update-email` — Initiate email update process (Sends OTPs to old and new email addresses).
* `PATCH /user/confirm-update-email` — Confirm email update by verifying the OTPs.
* `POST /user/user/2fa` — Send OTP to email to enable Two-Factor Authentication (2FA).
* `PATCH /user/user/2fa/enable` — Verify OTP and enable 2FA on the account.
* `PATCH /user/user/2fa/disable` — Disable 2FA on the account.

---

### 📝 Posts (`/posts`)

All routes below require the user to be authenticated.

* `GET /posts/feed` — Retrieve social feed (posts from friends + public posts + personal posts; excludes blocked users; paginated).
* `GET /posts/user/:userId` — Retrieve posts created by a specific user (filters by privacy levels: public, friends, or only me; excludes blocked users).
* `GET /posts/:postId` — Retrieve detailed specific post (paginated, previews up to 3 comments and metadata counts).
* `GET /posts/:postId/reactions` — Get user reaction list for a post (paginated).
* `GET /posts/:postId/comments` — Retrieve all comments for a specific post (paginated).
* `POST /posts/` — Create a new post (Supports up to 5 file attachments, checks mentions).
* `PATCH /posts/:postId` — Update post details or attachments.
* `PATCH /posts/:postId/reaction` — Toggle/set reaction on a post (like, love, etc.).
* `DELETE /posts/:postId` — Soft delete a post (Accessible by owner or admins).

---

### 💬 Comments & Replies (`/comments` & Nested `/posts/:postId/comments`)

All routes below require the user to be authenticated.

* `POST /posts/:postId/comments/{:commentId}` — Create a comment under a post, or a reply to an existing comment.
* `POST /comments/:commentId` — Reply directly to a comment.
* `GET /comments/:commentId/replies` — Get paginated replies to a specific comment.
* `GET /comments/:commentId/reactions` — Get user reactions on a comment.
* `PATCH /comments/:commentId/reaction` — Toggle/set reaction on a comment.
* `PATCH /comments/:commentId` — Update comment content or attachment.
* `DELETE /comments/:commentId` — Soft delete a comment or reply.

---

### 👥 Friends & Relations (`/friends`)

All routes below require the user to be authenticated.

* `GET /friends/suggest` — Fetch suggestions for new friends.
* `GET /friends/requests` — Retrieve all incoming/outgoing friend requests.
* `POST /friends/requests/send` — Send a friend request (Ensures recipient hasn't blocked the sender).
* `PATCH /friends/requests/:requestId/accept` — Accept a pending friend request (Creates bidirectional friendship entries).
* `PATCH /friends/requests/:requestId/reject` — Reject a received friend request.
* `DELETE /friends/requests/:requestId/cancel` — Cancel a pending outgoing request.
* `GET /friends` — Fetch list of all active friends.
* `DELETE /friends/:friendId/unfriend` — Remove a user from friends list (Deletes both friendship entries).
* `GET /friends/blocked` — Fetch list of all currently blocked users.
* `POST /friends/:blockedId/block` — Block a user (destroys active friendships).
* `DELETE /friends/:blockedId/unblock` — Unblock a user.

---

### 💬 Real-Time Chat (`/chat`)

All routes below require the user to be authenticated.

* `GET /chat/:receiverId` — Fetch chat history and conversation messages with a specific user.

---

### 🔥 Admin Console (`/admin`)

All routes require Admin privileges (`isAdmin` middleware validation).

* `GET /admin/posts/deleted` — List all soft-deleted posts in the system.
* `PATCH /admin/post/:postId/restore` — Restore a soft-deleted post.
* `DELETE /admin/post/:postId/hard` — Permanently delete a post from the database.
* `PATCH /admin/comment/:commentId/restore` — Restore a soft-deleted comment.
* `DELETE /admin/comment/:commentId/hard` — Permanently delete a comment from the database.

---

### 📝 Error Codes & Messages

| Code | Message | Description |
| :--- | :--- | :--- |
| `400` | `Invalid data` | Invalid request payload or validation error |
| `401` | `Unauthorized` | Invalid credentials or missing/expired token |
| `403` | `Access denied` | Insufficient permissions (not admin) |
| `404` | `Not found` | Requested resource does not exist |
| `409` | `Resource exists` | Account already exists |
| `429` | `Rate limit exceeded` | Too many requests |
| `500` | `Internal server error` | Unexpected server issue |


---
<p align="center" style="margin-top: 30px;">Made with ❤️ for Connectly</p>

