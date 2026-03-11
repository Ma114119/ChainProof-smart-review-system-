import json
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

# 1. Connection to your successful Ganache Workspace
GANACHE_URL = "http://127.0.0.1:7545"
web3 = Web3(Web3.HTTPProvider(GANACHE_URL))

# 2. THE CRITICAL FIX: Injects middleware to handle Network 1337 correctly
web3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

# 3. VERIFIED ADDRESSES (From your success on 2026-01-15)
LEDGER_ADDRESS = "0xb86a3BD514f9EB30A24f4715AC6C20911936D98c"
TOKEN_ADDRESS = "0x73bE4F042DA43e33dEE7Bc106f652bB50CdB0da3"

# 4. FULL ABI for ReviewLedger (Required for adding/getting hashes)
LEDGER_ABI = json.loads('[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"reviewId","type":"uint256"},{"indexed":false,"internalType":"string","name":"reviewHash","type":"string"}],"name":"ReviewHashAdded","type":"event"},{"inputs":[{"internalType":"uint256","name":"_reviewId","type":"uint256"},{"internalType":"string","name":"_reviewHash","type":"string"}],"name":"addReviewHash","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_reviewId","type":"uint256"}],"name":"getReviewHash","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}]')

# --- CORE BLOCKCHAIN FUNCTIONS ---

def test_blockchain_connection():
    """Verifies that the backend can talk to the contract."""
    if not web3.is_connected():
        return "❌ Error: Cannot see Ganache. Check the RPC Server!"
    
    try:
        target = web3.to_checksum_address(LEDGER_ADDRESS)
        contract = web3.eth.contract(address=target, abi=LEDGER_ABI)
        owner = contract.functions.owner().call()
        return f"✅ SUCCESS! Network: {web3.eth.chain_id} | Owner: {owner}"
    except Exception as e:
        return f"⚠️ Connection working, but call failed. Reason: {str(e)}"

def store_review_hash(review_id, review_content):
    """
    Creates a Keccak-256 hash of the review and stores it on the blockchain.
    """
    try:
        # Generate the cryptographic fingerprint
        review_hash = web3.keccak(text=review_content).hex()
        
        # Use the first account in Ganache to pay for the transaction
        admin_account = web3.eth.accounts[0]
        
        target = web3.to_checksum_address(LEDGER_ADDRESS)
        contract = web3.eth.contract(address=target, abi=LEDGER_ABI)
        
        # Execute the transaction
        tx_hash = contract.functions.addReviewHash(
            review_id, 
            review_hash
        ).transact({'from': admin_account})
        
        # Wait for confirmation
        receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
        
        return {
            "status": "✅ Success",
            "review_id": review_id,
            "blockchain_hash": review_hash,
            "tx_receipt": receipt.transactionHash.hex()
        }
    except Exception as e:
        return {"status": "❌ Failed", "error": str(e)}

def verify_review_integrity(review_id):
    """Retrieves the stored hash to verify if data has been tampered with."""
    try:
        target = web3.to_checksum_address(LEDGER_ADDRESS)
        contract = web3.eth.contract(address=target, abi=LEDGER_ABI)
        
        stored_hash = contract.functions.getReviewHash(review_id).call()
        
        if not stored_hash:
            return "🔍 No hash found for this review ID."
        return f"🔒 Stored Blockchain Hash: {stored_hash}"
    except Exception as e:
        return f"⚠️ Integrity check failed: {str(e)}"
    
    # 1. Add the Token ABI (Required for the transfer function)
TOKEN_ABI = json.loads('[{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]')

def reward_customer_token(owner_private_key, owner_address, customer_address):
    """
    Transfers 1 SRT from the Business Owner to the Customer after a successful review.
    """
    try:
        target_token = web3.to_checksum_address(TOKEN_ADDRESS)
        token_contract = web3.eth.contract(address=target_token, abi=TOKEN_ABI)
        
        # Amount is 1 token (considering 18 decimals)
        amount = 1 * (10**18)
        
        # Build the transaction
        nonce = web3.eth.get_transaction_count(owner_address)
        tx = token_contract.functions.transfer(
            web3.to_checksum_address(customer_address), 
            amount
        ).build_transaction({
            'chainId': 1337,
            'gas': 200000,
            'gasPrice': web3.to_wei('20', 'gwei'),
            'nonce': nonce,
        })
        
        # Sign and Send (This will eventually happen via MetaTask)
        signed_tx = web3.eth.account.sign_transaction(tx, private_key=owner_private_key)
        tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)
        
        return f"💰 Reward Sent! Hash: {tx_hash.hex()}"
    except Exception as e:
        return f"❌ Token transfer failed: {str(e)}"