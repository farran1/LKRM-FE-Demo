# Next.js Admin Dashboard

A modern admin dashboard built with Next.js 15, Ant Design, and TypeScript.

## Features

- 🚀 Next.js 15 with App Router
- 💅 Ant Design for UI components
- 📊 Responsive layout with sidebar
- 🔄 State management with Zustand
- 📡 API integration with Axios
- 🎨 SCSS for styling
- 📱 Mobile-friendly design

## Prerequisites

- Node.js v22.14.0 or later
- npm or yarn

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your environment variables:
```env
NEXT_PUBLIC_API_URL=your_api_url_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/                 # App router pages
├── components/          # React components
├── lib/                 # Utility functions and configurations
├── services/           # API services
├── store/              # Zustand store
└── styles/             # Global styles
```

## Available Scripts

- `npm run dev` - Run development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
