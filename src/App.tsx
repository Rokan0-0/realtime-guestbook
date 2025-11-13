// src/App.tsx
import { useSomnia } from './context/SomniaContext';
import { Guestbook } from './components/Guestbook'; // 1. Import our component
import './App.css'; // 2. We will add styles here

function App() {
  const { account, connectWallet } = useSomnia();

  return (
    <div className="container">
      <header>
        <h1>Somnia Real-Time Guestbook</h1>
        <p>A Hackathon Project by Rokan</p>
      </header>

      {/* If connected, show the Guestbook. If not, show the button. */}
      {account ? (
        <Guestbook />
      ) : (
        <div className="connect-wallet-container">
          <button onClick={connectWallet} className="connect-button">
            Connect Wallet to Start
          </button>
        </div>
      )}
    </div>
  );
}

export default App;