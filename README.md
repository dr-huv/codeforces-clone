# Codeforces Clone - Competitive Programming Platform

A full-stack competitive programming platform inspired by Codeforces and LeetCode, built with modern web technologies and microservices architecture.
<img width="1556" height="586" alt="image" src="https://github.com/user-attachments/assets/2be418f0-e750-4963-aab1-6668a6353691" />


## 🚀 Features

### Core Features
- **Problem Management**: Create, view, and solve coding problems
- **Real-time Contest System**: Timed contests with live leaderboards
- **Code Submission & Judging**: Automated code evaluation with multiple language support
- **User Profiles & Statistics**: Track progress, ratings, and achievements
- **Real-time Updates**: WebSocket-powered live updates for contests and submissions

### Technical Features
- **Microservices Architecture**: Scalable and maintainable design
- **Containerized Deployment**: Docker and Kubernetes support
- **Asynchronous Processing**: RabbitMQ for handling submission queue
- **Multi-Database Architecture**: PostgreSQL for user data, MongoDB for caching
- **Real-time Communication**: WebSocket integration for live updates
- **Secure Code Execution**: Docker-based sandboxed environment for code judging

## 🛠 Tech Stack

### Frontend
- **React 18** with Modern Hooks
- **Material-UI (MUI)** for responsive design
- **Context API** for state management
- **Monaco Editor** for code editing
- **Socket.io Client** for real-time updates
- **Vite** for fast development and building

### Backend
- **Node.js & Express** for API server
- **WebSocket (Socket.io)** for real-time features
- **PostgreSQL** for user data and problem storage
- **MongoDB** for submission caching and results
- **RabbitMQ** for asynchronous task processing
- **Redis** for session management and caching

### DevOps & Infrastructure
- **Docker** for containerization
- **Kubernetes** for orchestration
- **NGINX** for reverse proxy and load balancing
- **Docker Compose** for local development

## 🏗 Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Express Backend │    │  Judge Workers  │
│                 │    │                  │    │                 │
│ • Material UI   │◄───┤ • REST APIs      │◄───┤ • Code Execution│
│ • WebSocket     │    │ • WebSocket      │    │ • Docker Sandbox│
│ • Code Editor   │    │ • Authentication │    │ • Test Runner   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Databases     │    │  Message Queue  │
                       │                 │    │                 │
                       │ • PostgreSQL    │    │ • RabbitMQ      │
                       │ • MongoDB       │    │ • Redis         │
                       │ • Redis Cache   │    │                 │
                       └─────────────────┘    └─────────────────┘
```

## 🚀 Getting Started

### Prerequisites
- Node.js (>=18.0.0)
- Docker & Docker Compose
- PostgreSQL
- MongoDB
- RabbitMQ
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dr-huv/codeforces-clone.git
   cd codeforces-clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # Edit the .env files with your configuration
   ```

4. **Start services with Docker**
   ```bash
   docker-compose -f docker/docker-compose.yml up -d
   ```

5. **Run the application**
   ```bash
   # Development mode (runs both frontend and backend)
   npm run dev

   # Or run separately
   npm run backend:dev  # Backend on http://localhost:5000
   npm run frontend:dev # Frontend on http://localhost:3000
   ```

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=codeforces_clone
DB_USER=postgres
DB_PASSWORD=password

# MongoDB
MONGODB_URI=mongodb://localhost:27017/codeforces_submissions

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# Redis
REDIS_URL=redis://localhost:6379

# Judge System
JUDGE_TIMEOUT=10000
MAX_MEMORY=128MB
DOCKER_IMAGE=judge-runner:latest
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=Codeforces Clone
```

## 📁 Project Structure

```
codeforces-clone/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── common/      # Shared components
│   │   │   ├── problems/    # Problem-related components
│   │   │   ├── contests/    # Contest-related components
│   │   │   └── profile/     # User profile components
│   │   ├── contexts/        # React contexts for state management
│   │   ├── services/        # API and WebSocket services
│   │   └── utils/           # Utility functions
│   └── package.json
├── backend/                  # Node.js backend application
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   ├── services/        # Business logic services
│   │   └── utils/           # Utility functions
│   ├── judge/               # Code judging system
│   │   ├── docker/          # Docker configurations for judging
│   │   ├── scripts/         # Judge worker scripts
│   │   └── sandbox/         # Sandbox configuration
│   └── package.json
├── docker/                   # Docker configurations
│   ├── docker-compose.yml   # Multi-service setup
│   ├── Dockerfile.frontend  # Frontend container
│   ├── Dockerfile.backend   # Backend container
│   └── nginx.conf           # NGINX configuration
├── kubernetes/               # Kubernetes manifests
│   ├── deployments/         # Application deployments
│   ├── services/            # Kubernetes services
│   ├── configmaps/          # Configuration maps
│   └── secrets/             # Secret configurations
├── scripts/                  # Utility scripts
│   ├── setup.sh             # Initial setup script
│   ├── deploy.sh            # Deployment script
│   └── seed-data.js         # Database seeding
└── README.md
```

## 🔧 Development

### Running Tests
```bash
# Run all tests
npm test

# Run backend tests only
npm run backend:test

# Run frontend tests only
npm run frontend:test
```

### Code Style
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Database Setup
```bash
# Seed the database with sample data
npm run seed
```

## 🚢 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
npm run docker:build
npm run docker:up
```

### Kubernetes Deployment
```bash
# Deploy to Kubernetes cluster
npm run k8s:deploy

# Remove from Kubernetes cluster
npm run k8s:delete
```

## 🏆 Key Components

### 1. Problem System
- Create and manage coding problems
- Support for multiple programming languages
- Test case management
- Difficulty levels and tags

### 2. Contest System
- Real-time contests with countdown timers
- Live leaderboards with WebSocket updates
- Contest registration and participation
- Rating system based on performance

### 3. Judge System
- Secure code execution in Docker containers
- Multiple programming language support (C++, Java, Python, JavaScript)
- Resource limitations (time, memory)
- Comprehensive test case evaluation

### 4. User System
- User registration and authentication
- Profile management and statistics
- Progress tracking and achievements
- Rating and ranking system

## 🔒 Security Features

- JWT-based authentication
- Rate limiting for API endpoints
- Input validation and sanitization
- Docker-based code sandboxing
- CORS protection
- Helmet.js security headers

## 🌟 Performance Optimizations

- Redis caching for frequent queries
- Database indexing for fast lookups
- Pagination for large datasets
- Lazy loading for React components
- Code splitting and bundling optimization

## 📊 Monitoring & Logging

- Winston logger for structured logging
- Request/response logging with Morgan
- Error tracking and monitoring
- Performance metrics collection

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/dr-huv/codeforces-clone)
- [Documentation](docs/)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)

## 👨‍💻 Author

**dr-huv** - [GitHub Profile](https://github.com/dr-huv)

---

⭐ Star this repository if you find it helpful!
