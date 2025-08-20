import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">StakeGovernance DApp</h1>
      <nav className="space-x-4">
        <Link to="/dashboard" className="hover:underline">Dashboard</Link>
        <Link to="/governance" className="hover:underline">Governance</Link>
      </nav>
      <ConnectButton />
    </header>
  );
}
