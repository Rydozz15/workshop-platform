import './globals.css';

export const metadata = {
  title: 'ISSDE Workshop',
  description: 'Interactive chatbot workshop platform for case-based scenarios',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
