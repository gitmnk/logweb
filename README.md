# LogWeb - Voice-Enabled Journal App

A modern journaling application built with Next.js that supports both text and voice input.

## Features

- User authentication (register/login)
- Journal entry creation and management
- Voice input support (coming soon)
- Modern, responsive UI with Tailwind CSS
- Secure data storage with Prisma and SQLite

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js
- **Testing**: Jest
- **Type Safety**: TypeScript

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
4. Initialize the database:
   ```bash
   npx prisma migrate dev
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── journal/        # Journal pages
│   ├── login/         # Authentication pages
│   └── register/      # User registration
├── components/         # Reusable React components
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── __tests__/         # Test files
```

## Environment Variables

- `DATABASE_URL`: SQLite database URL
- `NEXTAUTH_URL`: NextAuth.js URL
- `NEXTAUTH_SECRET`: Secret key for JWT encryption

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT License 