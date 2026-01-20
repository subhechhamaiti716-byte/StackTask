/**
 * Mock Auth Service utilizing LocalStorage
 * Since the app is offline-first, this mocks a backend flow natively.
 */

export class AuthService {
  constructor() {
    this.users = JSON.parse(localStorage.getItem('users')) || [];
    this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
  }

  // Exposed state checks
  isAuthenticated() {
    return this.currentUser !== null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  signup(username, email, password, confirmPassword) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!username || !email || !password || !confirmPassword) {
          return reject(new Error("All fields are required."));
        }

        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!strongPasswordRegex.test(password)) {
          return reject(new Error("Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character."));
        }

        if (password !== confirmPassword) {
          return reject(new Error("Passwords do not match."));
        }
        
        const existingUser = this.users.find(u => u.email === email);
        if (existingUser) {
          return reject(new Error("User with this email already exists."));
        }

        const newUser = {
          id: 'usr_' + Date.now().toString(36),
          username: username,
          email: email,
          password: btoa(password), // simple mock hash
          createdAt: Date.now()
        };

        this.users.push(newUser);
        localStorage.setItem('users', JSON.stringify(this.users));
        
        resolve(newUser);
      }, 400); // mock network delay
    });
  }

  login(email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!email || !password) {
          return reject(new Error("Email and Password are required."));
        }

        const user = this.users.find(u => u.email === email && u.password === btoa(password));
        if (!user) {
          return reject(new Error("Invalid email or password."));
        }

        this.currentUser = { id: user.id, username: user.username, email: user.email };
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        window.dispatchEvent(new Event('auth-changed'));
        resolve(this.currentUser);
      }, 400);
    });
  }

  logout() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        window.dispatchEvent(new Event('auth-changed'));
        resolve();
      }, 200);
    });
  }
}

export const authService = new AuthService();
