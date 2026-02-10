# Inertia Chat – Web Client

Modern web client for Inertia Chat, built with Next.js.


## Prerequisites

- Node.js 20+
- npm or pnpm
- Backend server running (see [Server](#server) section)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Muneeb-Almoliky/inertia-chat-web-client.git
cd inertia-chat-web-client
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8081
NEXT_PUBLIC_WS_URL=http://localhost:8081/ws
```

Adjust the ports if your backend server runs on different ones.

### 4. Start the development server

```bash
npm run dev
```

### 5. Open the application

Navigate to [http://localhost:3000](http://localhost:3000)

## Server

The backend API is built with **Java Spring Boot**.

Repository: [Inertia Chat Server](https://github.com/khaledsAlshibani/inertia-chat-server)

Make sure the backend server is running before starting the web client.

## Screenshots

### Login
![Login](./screenshots/login.png)

### Sign Up
![Sign Up](./screenshots/signup.png)

### Chat List
![Chat List](./screenshots/chat-list.png)

### New Chat
![New Chat](./screenshots/new-chat.png)

### Direct Chat View
![One-to-One Chat View](./screenshots/chat-view.png)

### Group Chat View
![Group Chat View](./screenshots/group-chat-view.png)

### Create Group
![Create Group](./screenshots/create-group.png)

### Group Settings
![Group Settings](./screenshots/group-settings.png)

### Add Members Modal
![Add Members Modal](./screenshots/add-member-modal.png)

### User Profile
![Profile Page](./screenshots/profile.png)

### Menus & Dropdowns
- **User Settings Dropdown**
  ![User Settings Dropdown](./screenshots/user-settings-dropdown.png)
- **Group Settings Dropdown**
  ![Group Settings Dropdown](./screenshots/group-settings-dropdown.png)
