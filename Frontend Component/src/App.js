import './App.css';
import '@rainbow-me/rainbowkit/styles.css';

import React, { useState, useEffect } from 'react';
import { getDefaultConfig, RainbowKitProvider, ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, WagmiProvider, useReadContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readContract } from 'wagmi/actions';
import { http } from 'viem';
import { QrScanner } from '@yudiel/react-qr-scanner';

// =====================================================================================
// Final Configuration Details - All Filled In
// =====================================================================================
const contractAddress = '0x2f31220e16662a5658201c900d2d597fdaa56779';
const projectId = '6f4d606d4ddf35393d1b24997331ded3';
const alchemyRpcUrl = 'https://eth-sepolia.g.alchemy.com/v2/rzGRa98vm1wssPpveNduW';
const IS_DEMO_MODE = true; // Set this to false when you want to connect to a real backend

// This is the correct ABI from the SBT.json file your team provided.
const contractABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"eventId","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"maxHours","type":"uint256"}],"name":"EventMaxHoursSet","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"student","type":"address"},{"indexed":true,"internalType":"bytes32","name":"eventId","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"contributedHours","type":"uint256"},{"indexed":false,"internalType":"string","name":"uri","type":"string"},{"indexed":false,"internalType":"address","name":"organizer","type":"address"}],"name":"Minted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"org","type":"address"}],"name":"OrganizerAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"org","type":"address"}],"name":"OrganizerRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"org","type":"address"}],"name":"addOrganizer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"},{"internalType":"address","name":"","type":"address"}],"name":"eventClaimed","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"org","type":"address"}],"name":"isOrganizer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"maxHoursPerEvent","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"student","type":"address"},{"internalType":"string","name":"uri","type":"string"},{"internalType":"bytes32","name":"nonce32","type":"bytes32"},{"internalType":"bytes32","name":"eventId","type":"bytes32"},{"internalType":"uint256","name":"contributedHours","type":"uint256"},{"internalType":"address","name":"organizer","type":"address"}],"name":"mintSBT","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nextId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"organizers","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"org","type":"address"}],"name":"removeOrganizer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"eventId","type":"bytes32"},{"internalType":"uint256","name":"maxHours","type":"uint256"}],"name":"setMaxHoursForEvent","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"usedNonces","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}];

const config = getDefaultConfig({ appName: 'VolunteerChain', projectId, chains: [sepolia], transports: { [sepolia.id]: http(alchemyRpcUrl) } });
const queryClient = new QueryClient();

// --- Helper Function ---
const getHttpUrl = (ipfsUrl) => {
  if (!ipfsUrl || !ipfsUrl.startsWith('ipfs://')) return null;
  const cid = ipfsUrl.substring(7);
  return `https://ipfs.io/ipfs/${cid}`;
};

// --- React Components ---

// Hardcoded metadata for the demo
const DEMO_METADATA = {
    name: "RMIT Library Fundraiser",
    description: "Credential for contributing volunteer hours.",
    image: "https://placehold.co/320x200/5C6BC0/FFFFFF?text=VolunteerChain",
    attributes: [
        { trait_type: "Event", value: "RMIT Library Fundraiser" },
        { trait_type: "Hours", value: 4 },
        { trait_type: "Role", value: "Event Organizer" },
        { trait_type: "Organizer", value: "RMIT University" }
    ]
};

// Dashboard Component to display token balance
function Dashboard({ simulatedBalance }) {
    const { isConnected } = useAccount();

    if (!isConnected) return <div className="text-center mt-10"><h2 className="text-2xl font-semibold">Please connect your wallet.</h2></div>;

    const hasTokens = simulatedBalance > 0;

    return (
        <div className="text-center mt-10">
            <h2 className="text-3xl font-bold mb-6">My Dashboard</h2>
            {!hasTokens ? (
                <p className="text-gray-600">You have no volunteer credentials yet.</p>
            ) : (
                <div>
                    <p className="text-lg">You have {simulatedBalance.toString()} credential(s).</p>
                    <p className="text-sm text-gray-500 mt-2">(Note: Full list display is not implemented.)</p>
                </div>
            )}
        </div>
    );
}

// Scanner Component for QR code
function Scanner({ onMintSuccess }) {
    const [scanResult, setScanResult] = useState(null);
    const [isScanning, setIsScanning] = useState(true);
    const [mintStatus, setMintStatus] = useState('idle');

    const handleScan = (result, error) => {
        if (result) {
            setIsScanning(false);
            const scannedText = result; // Correctly access the raw text from the scanner
            try {
                const parsedResult = JSON.parse(scannedText);
                if (parsedResult.eventId && parsedResult.contributedHours && parsedResult.organizerAddress && parsedResult.nonce) {
                    setScanResult(parsedResult);
                } else {
                    setScanResult({ error: "Invalid QR Code format." });
                }
            } catch (e) {
                setScanResult({ error: "Could not parse QR Code." });
            }
        }
    };

    const handleMintToken = async () => {
        if (!scanResult || scanResult.error) return;
        setMintStatus('minting');
        try {
            console.log("Simulating mint request:", scanResult);
            // Simulate the backend call and blockchain transaction
            await new Promise(resolve => setTimeout(resolve, 4000));
            setMintStatus('success');
            // Call the passed-down function to update the simulated balance
            onMintSuccess();
            alert(`Minting was successful! Check your dashboard in a few moments.`);
        } catch (error) {
            console.error("Minting simulation failed:", error);
            setMintStatus('error');
            alert(`Minting failed: ${error.message}`);
        }
    };

    return (
        <div className="verification-container">
            <h2 className="text-2xl font-bold mb-4">Scan Event QR Code</h2>
            {isScanning && (
                <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
                    <QrScanner onDecode={handleScan} onError={(error) => console.log(error?.message)} />
                    <p className="text-center text-gray-500 mt-2">Point your camera at the QR code</p>
                </div>
            )}
            {scanResult && (
                scanResult.error ? (
                    <div className="text-red-600 bg-red-100 p-4 rounded-lg"><p><strong>Scan Error:</strong> {scanResult.error}</p></div>
                ) : (
                    <div className="text-left bg-gray-50 p-6 rounded-lg shadow-inner">
                        <h3 className="text-xl font-semibold mb-4 text-green-700">✅ QR Code Scanned Successfully!</h3>
                        <p><strong>Event:</strong> {scanResult.eventId}</p>
                        <p><strong>Hours:</strong> {scanResult.contributedHours}</p>
                        <p><strong>Organizer:</strong> {scanResult.organizerAddress}</p>
                        <button onClick={handleMintToken} disabled={mintStatus === 'minting' || mintStatus === 'success'} className="mt-6 w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 transition">
                            {mintStatus === 'minting' ? 'Minting In Progress...' : mintStatus === 'success' ? 'Credential Claimed!' : 'Claim My Credential'}
                        </button>
                    </div>
                )
            )}
        </div>
    );
}

// This component is now fixed to handle the demo case
function CredentialCard({ tokenId }) {
  const [metadata, setMetadata] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Read the tokenURI only if not in demo mode
  const { data: tokenURI } = useReadContract({ 
      address: contractAddress, 
      abi: contractABI, 
      functionName: 'tokenURI', 
      args: [tokenId],
      query: { enabled: !IS_DEMO_MODE } // Only fetch from the blockchain if not in demo mode
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      if (IS_DEMO_MODE) {
          // In demo mode, use hardcoded data
          const demoData = DEMO_METADATA;
          // Map hardcoded data to the expected format
          const formattedMetadata = {
              ...demoData,
              attributes: Object.fromEntries(demoData.attributes.map(attr => [attr.trait_type.toLowerCase(), attr.value]))
          };
          setMetadata(formattedMetadata);
          setIsLoading(false);
          return;
      }

      // If not in demo mode, proceed with IPFS fetch
      if (!tokenURI) return;
      const httpUrl = getHttpUrl(tokenURI);
      if (!httpUrl) { setIsLoading(false); return; }
      try {
        const response = await fetch(httpUrl);
        const data = await response.json();
        setMetadata(data);
      } catch (error) { console.error("Failed to fetch metadata:", error); }
      finally { setIsLoading(false); }
    };
    fetchMetadata();
  }, [tokenURI]);

  if (isLoading) return <div className="card loading-card">Loading Token #{tokenId.toString()}...</div>;
  if (!metadata) return <div className="card error-card">Could not load credential #{tokenId.toString()}</div>;

  return (
    <div className="card">
      <img src={metadata.image || 'https://placehold.co/320x200/eee/333?text=No+Image'} alt={metadata.name} className="card-image" />
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

function Verification() {
  const [tokenId, setTokenId] = useState('');
  const [verifiedTokenId, setVerifiedTokenId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerification = async () => {
    if (!tokenId || isNaN(parseInt(tokenId))) { setError('Please enter a valid Token ID.'); return; }
    setIsLoading(true);
    setError('');
    setVerifiedTokenId(null);

    // This block is for the demo
    if (IS_DEMO_MODE) {
        if (parseInt(tokenId) === 1) { // Only show success for Token ID #1
            setVerifiedTokenId(BigInt(tokenId));
        } else {
            setError(`Credential with Token ID #${tokenId} could not be found.`);
        }
        setIsLoading(false);
        return;
    }

    // Original code for a real blockchain connection
    try {
      await readContract(config, { address: contractAddress, abi: contractABI, functionName: 'tokenURI', args: [BigInt(tokenId)] });
      setVerifiedTokenId(BigInt(tokenId));
    } catch (e) {
      console.error(e);
      setError(`Credential with Token ID #${tokenId} could not be found.`);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="verification-container">
      <h2>Credential Verification</h2>
      <p>Enter the Token ID to verify its authenticity.</p>
      <div className="input-group">
        <input type="number" value={tokenId} onChange={(e) => setTokenId(e.target.value)} placeholder="Enter Token ID (e.g., 1)" />
        <button onClick={handleVerification} disabled={isLoading}>{isLoading ? 'Verifying...' : 'Verify'}</button>
      </div>
      {error && <p className="error-message">{error}</p>}
      {verifiedTokenId !== null && (
        <div className="verified-result">
          <h3>✅ Verification Successful</h3>
          <CredentialCard tokenId={verifiedTokenId} />
        </div>
      )}
    </div>
  );
}

// This is your main application logic
function App() {
  const [view, setView] = useState('dashboard');
  // Temporary state to simulate the token balance for your demo
  const [simulatedTokenBalance, setSimulatedTokenBalance] = useState(0);

  // This function is passed to the Scanner to update the simulated balance
  const onMintSuccess = () => {
    setSimulatedTokenBalance(prev => prev + 1);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>VolunteerChain 🏅</h1>
        <nav>
          <button onClick={() => setView('dashboard')}>My Dashboard</button>
          <button onClick={() => setView('verification')}>Verify Credential</button>
          <button onClick={() => setView('scanner')} className="font-bold text-indigo-600 border-2 border-indigo-500 rounded-md px-3 py-1">Scan QR</button>
        </nav>
        <ConnectButton />
      </header>
      <main>
        {/* The Dashboard component now receives the simulated balance */}
        {view === 'dashboard' && <Dashboard simulatedBalance={simulatedTokenBalance} />}
        {view === 'verification' && <Verification />}
        {/* The Scanner component receives the function to update the balance */}
        {view === 'scanner' && <Scanner onMintSuccess={onMintSuccess} />}
      </main>
    </div>
  );
}

// This is the component that wraps your main App component with providers
function AppWrapper() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {/* This is where the App component is rendered */}
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default AppWrapper;