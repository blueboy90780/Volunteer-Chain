import './App.css';
import '@rainbow-me/rainbowkit/styles.css';

import React, { useState, useEffect } from 'react';
import { getDefaultConfig, RainbowKitProvider, ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, WagmiProvider } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readContract } from 'wagmi/actions';

// =====================================================================================
// TODO: Step 1 - Add your Contract Details Here
// =====================================================================================
const contractAddress = '0xYourSmartContractAddressHere';
const contractABI = [
  // This is an EXAMPLE ABI. You MUST get the real one from Heinrich/Tuấn.
  { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "getTokensOfOwner", "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "tokenURI", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }
];

// =====================================================================================
// TODO: Step 2 - Add your WalletConnect Project ID Here
// =====================================================================================
const config = getDefaultConfig({
  appName: 'VolunteerChain',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Get one from https://cloud.walletconnect.com
  chains: [sepolia],
});

const queryClient = new QueryClient();

// =====================================================================================
// Helper Function to convert IPFS links
// =====================================================================================
const getHttpUrl = (ipfsUrl) => {
  if (!ipfsUrl || !ipfsUrl.startsWith('ipfs://')) return null;
  const cid = ipfsUrl.substring(7);
  return `https://ipfs.io/ipfs/${cid}`;
};

// =====================================================================================
// --- CredentialCard Component ---
// This component displays a single SBT credential by fetching its own data.
// =====================================================================================
function CredentialCard({ tokenId }) {
  const [metadata, setMetadata] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data: tokenURI, error: uriError } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'tokenURI',
    args: [tokenId],
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!tokenURI) return;
      const httpUrl = getHttpUrl(tokenURI);
      if (!httpUrl) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(httpUrl);
        const data = await response.json();
        setMetadata(data);
      } catch (error) {
        console.error("Failed to fetch metadata:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetadata();
  }, [tokenURI]);

  if (isLoading) {
    return <div className="card loading-card">Loading Token #{tokenId.toString()}...</div>;
  }
  if (uriError || !metadata) {
    return <div className="card error-card">Could not load credential #{tokenId.toString()}</div>;
  }

  return (
    <div className="card">
      <img src={getHttpUrl(metadata.image)} alt={metadata.name} className="card-image" />
      <div className="card-content">
        <h3>{metadata.name}</h3>
        <p><strong>Token ID:</strong> {tokenId.toString()}</p>
        <p><strong>Event:</strong> {metadata.attributes?.event || 'N/A'}</p>
        <p><strong>Role:</strong> {metadata.attributes?.role || 'N/A'}</p>
        <p><strong>Hours:</strong> {metadata.attributes?.hours || 'N/A'}</p>
      </div>
    </div>
  );
}

// =====================================================================================
// --- Verification Component ---
// This component handles the public verification of a credential.
// =====================================================================================
function Verification() {
  const [tokenId, setTokenId] = useState('');
  const [verifiedTokenId, setVerifiedTokenId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerification = async () => {
    if (!tokenId || isNaN(parseInt(tokenId))) {
      setError('Please enter a valid Token ID.');
      return;
    }
    setIsLoading(true);
    setError('');
    setVerifiedTokenId(null);

    try {
      await readContract(config, {
        address: contractAddress,
        abi: contractABI,
        functionName: 'tokenURI',
        args: [BigInt(tokenId)],
      });
      setVerifiedTokenId(BigInt(tokenId));
    } catch (e) {
      console.error(e);
      setError(`Credential with Token ID #${tokenId} could not be found.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="verification-container">
      <h2>Credential Verification</h2>
      <p>Enter the Token ID of a VolunteerChain credential to verify its authenticity.</p>
      <div className="input-group">
        <input
          type="number"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder="Enter Token ID (e.g., 1)"
        />
        <button onClick={handleVerification} disabled={isLoading}>
          {isLoading ? 'Verifying...' : 'Verify'}
        </button>
      </div>
      {error && <p className="error-message">{error}</p>}
      {verifiedTokenId !== null && (
        <div className="verified-result">
          <h3>✅ Verification Successful</h3>
          <p>Displaying authentic credential for Token ID #{verifiedTokenId.toString()}:</p>
          <CredentialCard tokenId={verifiedTokenId} />
        </div>
      )}
    </div>
  );
}

// =====================================================================================
// --- Dashboard Component ---
// This component displays the credentials for the currently connected user.
// =====================================================================================
function Dashboard() {
  const { address, isConnected } = useAccount();

  const { data: tokenIds, isLoading, error } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getTokensOfOwner',
    args: [address],
    query: { enabled: isConnected },
  });

  if (!isConnected) return <h2>Please connect your wallet to view your credentials.</h2>;
  if (isLoading) return <h2>Loading your credentials...</h2>;
  if (error) return <h2>Error loading credentials. Make sure you are on the Sepolia network.</h2>;
  if (!tokenIds || tokenIds.length === 0) return <h2>You have no volunteer credentials yet.</h2>;

  return (
    <div className="credential-grid">
      {tokenIds.map((tokenId) => (
        <CredentialCard key={tokenId.toString()} tokenId={tokenId} />
      ))}
    </div>
  );
}

// =====================================================================================
// --- Main App Component ---
// This is the root of your application, managing views and layout.
// =====================================================================================
function App() {
  const [view, setView] = useState('dashboard');

  return (
    <div className="App">
      <header className="App-header">
        <h1>VolunteerChain 🏅</h1>
        <nav>
          <button onClick={() => setView('dashboard')}>My Dashboard</button>
          <button onClick={() => setView('verification')}>Verify Credential</button>
        </nav>
        <ConnectButton />
      </header>
      <main>
        {view === 'dashboard' ? <Dashboard /> : <Verification />}
      </main>
    </div>
  );
}

// =====================================================================================
// --- AppWrapper (Exported Component) ---
// This wraps your entire App in the necessary providers for blockchain functionality.
// =====================================================================================
function AppWrapper() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default AppWrapper;