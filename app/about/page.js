export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">About Trading Journal</h1>
      
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Project Overview</h2>
        <p className="mb-4">
          Trading Journal is a comprehensive web application designed for individual stock market investors.
          It helps you record, analyze, and learn from your trading activities while also facilitating
          the sharing of trading strategies within the community.
        </p>
        <p>
          Built with modern web technologies, this application provides a secure and user-friendly
          platform to improve your trading performance over time.
        </p>
      </div>
      
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Key Features</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <span className="font-medium">Transaction Management:</span> Record buy/sell
            transactions with details on price, quantity, fees, and taxes.
          </li>
          <li>
            <span className="font-medium">Performance Analysis:</span> Visualize your investment
            performance with detailed metrics and charts.
          </li>
          <li>
            <span className="font-medium">Personal Journal:</span> Document your thoughts,
            emotions, and lessons learned from each trade.
          </li>
          <li>
            <span className="font-medium">Strategy Sharing:</span> Share and discover trading
            strategies with fellow investors.
          </li>
          <li>
            <span className="font-medium">Secure Authentication:</span> Your data is protected
            with secure local authentication.
          </li>
        </ul>
      </div>
      
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Tech Stack</h2>
        <p className="mb-4">
          This application is built using the following technologies:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <span className="font-medium">Frontend:</span> Next.js (React Framework)
          </li>
          <li>
            <span className="font-medium">Backend:</span> Next.js API Routes
          </li>
          <li>
            <span className="font-medium">Database:</span> SQLite via Prisma ORM
          </li>
          <li>
            <span className="font-medium">Authentication:</span> NextAuth.js
          </li>
          <li>
            <span className="font-medium">Styling:</span> Tailwind CSS
          </li>
        </ul>
      </div>
    </div>
  );
} 