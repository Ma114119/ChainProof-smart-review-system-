/**
 * Wallet connection utilities for MetaMask.
 * Forces account selection popup so each user can choose their own account
 * (fixes issue where everyone was getting the same cached "Admin Anas" account).
 */

/**
 * Request MetaMask accounts, forcing the account selection popup to appear every time.
 * Uses wallet_requestPermissions first to ensure MetaMask shows the account picker,
 * then eth_requestAccounts to get the selected account(s).
 * @returns {Promise<string[]>} Array of account addresses
 */
export async function requestMetaMaskAccounts() {
  if (!window.ethereum) {
    throw new Error('MetaMask not found. Please install MetaMask from metamask.io');
  }

  // Step 1: Request permissions - this forces MetaMask to show the account selection popup
  // even when the user has previously connected. Without this, MetaMask returns the
  // cached/last-selected account without showing the picker.
  try {
    await window.ethereum.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }],
    });
  } catch (permErr) {
    // 4001 = User rejected the request
    if (permErr?.code === 4001) {
      throw permErr;
    }
    // Method not supported or other error - fall through to eth_requestAccounts
  }

  // Step 2: Get the selected account(s)
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return accounts || [];
}

/**
 * Shorten a wallet address for display (e.g., 0x1A2b...3c4D)
 * @param {string} address - Full Ethereum address
 * @param {number} charsStart - Characters to show at start (default 6)
 * @param {number} charsEnd - Characters to show at end (default 4)
 * @returns {string}
 */
export function shortenAddress(address, charsStart = 6, charsEnd = 4) {
  if (!address || typeof address !== 'string') return '';
  if (address.length <= charsStart + charsEnd) return address;
  return `${address.slice(0, charsStart)}...${address.slice(-charsEnd)}`;
}
