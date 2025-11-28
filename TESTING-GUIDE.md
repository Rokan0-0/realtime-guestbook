# Testing Guide for Real-time Guestbook

This guide will help you test all the features and fixes we've implemented.

## 🚀 Quick Start

### 1. Start the Development Server

```bash
npm run dev
```

This will start the Vite development server, usually at `http://localhost:5173`

### 2. Open in Browser

Navigate to the URL shown in your terminal (typically `http://localhost:5173`)

---

## ✅ Testing Checklist

### Prerequisites Setup

Before testing, make sure you have:

- [ ] **MetaMask installed** in your browser
- [ ] **Somnia Testnet added** to MetaMask:
  - Network Name: `Somnia Testnet`
  - RPC URL: `https://dream-rpc.somnia.network`
  - Chain ID: `50312`
  - Currency Symbol: `STT`
- [ ] **Test tokens** from [Somnia Faucet](https://faucet.somnia.network)
- [ ] **Browser console open** (F12) to see logs

---

## 🧪 Test Scenarios

### Test 1: Wallet Connection ✅

**Steps:**
1. Open the app in your browser
2. Click "Connect Wallet to Start"
3. Approve the MetaMask connection request

**Expected Results:**
- ✅ Wallet address appears in the UI
- ✅ Guestbook form becomes visible
- ✅ Console shows: "Wallet Connected" and "SDK Initialized"
- ✅ Schema registration process starts (may prompt for transaction)

**What to Check:**
- Schema registration may ask for MetaMask approval (this is normal)
- If schema is already registered, it should skip registration
- Console should show schema ID computation

---

### Test 2: Message Persistence (localStorage) ✅

**Steps:**
1. Connect your wallet
2. Type a test message (e.g., "Hello from test!")
3. Click "Sign & Publish"
4. Approve the transaction in MetaMask
5. Wait for confirmation
6. **Refresh the page** (F5 or Ctrl+R)
7. Check if your message still appears

**Expected Results:**
- ✅ Message appears immediately after sending (optimistic update)
- ✅ Transaction hash is shown in console
- ✅ After page refresh, message is still visible
- ✅ Message has a "View on Explorer" link

**What to Check:**
- Open browser DevTools → Application → Local Storage
- Look for `guestbook_messages` key
- Should contain JSON array of messages
- Messages should persist even after closing browser

---

### Test 3: Real-time Updates (Polling) ✅

**Steps:**
1. Open the app in **Browser Tab 1**
2. Connect wallet and send a message
3. Open the app in **Browser Tab 2** (or different browser)
4. Connect a different wallet (or same wallet)
5. Wait 10-15 seconds
6. Check if the message from Tab 1 appears in Tab 2

**Expected Results:**
- ✅ Messages from other users appear (may take up to 10 seconds due to polling)
- ✅ Console shows "Polling for new events..."
- ✅ No duplicate messages appear
- ✅ Messages are added to localStorage automatically

**What to Check:**
- Console logs should show polling activity
- If SDK subscribe works, you'll see "Successfully subscribed via SDK!"
- If it fails, you'll see "Using polling fallback for real-time updates"

---

### Test 4: Transaction Verification ✅

**Steps:**
1. Send a message
2. Wait for transaction confirmation
3. Click the "View on Explorer" link below the message

**Expected Results:**
- ✅ Link opens Shannon Explorer in new tab
- ✅ Transaction details are visible on blockchain
- ✅ Transaction hash matches the one in console

**What to Check:**
- Explorer URL format: `https://shannon-explorer.somnia.network/tx/[TX_HASH]`
- Transaction should show as confirmed
- Can verify message data on-chain

---

### Test 5: Error Handling ✅

**Steps:**
1. Try to send a message without connecting wallet
2. Try to send an empty message
3. Reject a MetaMask transaction
4. Check console for error messages

**Expected Results:**
- ✅ Appropriate alerts/errors shown
- ✅ Console logs helpful error messages
- ✅ App doesn't crash
- ✅ User can retry after errors

**What to Check:**
- Error messages are user-friendly
- Schema registration errors don't block the app
- Failed transactions are handled gracefully

---

### Test 6: Refresh Button ✅

**Steps:**
1. Connect wallet
2. Send a few messages
3. Click the "Refresh" button in the feed header
4. Check console for loading state

**Expected Results:**
- ✅ Button shows "Loading..." while fetching
- ✅ Messages reload from localStorage
- ✅ No duplicate messages appear
- ✅ Button returns to "Refresh" after loading

---

### Test 7: Multiple Messages ✅

**Steps:**
1. Send 3-5 different messages
2. Check the message feed
3. Verify message order (newest first)
4. Refresh page and verify all messages persist

**Expected Results:**
- ✅ All messages appear in feed
- ✅ Messages are ordered correctly (newest at top)
- ✅ Each message has unique styling
- ✅ All messages persist after refresh

---

## 🔍 Console Logging

Watch the browser console (F12) for these important logs:

### Successful Flow:
```
Wallet Connected: 0x...
SDK Initialized
Computing Schema ID...
Schema ID Computed: 0x...
Checking if schema is registered...
Setting up guestbook subscription...
Successfully subscribed via SDK! (or "Using polling fallback")
Sending message...
Message sent! TxHash: 0x...
```

### If Issues Occur:
- `Schema registration check failed` - Known SDK issue, app continues
- `Failed to subscribe` - Falls back to polling (expected)
- `Error emitting event` - Message still published, just no event

---

## 🐛 Common Issues & Solutions

### Issue: "Please install MetaMask!"
**Solution:** Install MetaMask extension and refresh page

### Issue: "Insufficient funds"
**Solution:** Get test tokens from [Somnia Faucet](https://faucet.somnia.network)

### Issue: Schema registration keeps asking
**Solution:** This is a known SDK issue. The app will continue even if check fails.

### Issue: Messages not appearing from other users
**Solution:** 
- Wait 10-15 seconds (polling interval)
- Check console for subscription status
- Verify both users are on same network (Somnia Testnet)

### Issue: Messages disappear after refresh
**Solution:** 
- Check browser localStorage (DevTools → Application)
- Verify `guestbook_messages` key exists
- Check console for errors during fetch

---

## 📊 Testing the Fixes

### Fix 1: Message Persistence ✅
- **Test:** Send message → Refresh page → Message still there
- **Verify:** Check localStorage for `guestbook_messages`

### Fix 2: Real-time Updates ✅
- **Test:** Two browsers → Send from one → Appears in other
- **Verify:** Console shows polling or subscription working

### Fix 3: Error Handling ✅
- **Test:** Reject transactions, disconnect wallet, etc.
- **Verify:** App doesn't crash, shows helpful errors

### Fix 4: Schema Checks ✅
- **Test:** Connect wallet multiple times
- **Verify:** Schema registration doesn't block usage

---

## 🎯 Production Build Test

Before deploying, test the production build:

```bash
npm run build
npm run preview
```

This builds and serves the production version. Test all features again to ensure everything works in production mode.

---

## 📝 Notes

- **Polling Interval:** Currently set to 10 seconds. Can be adjusted in `SomniaContext.tsx`
- **localStorage Limit:** Browser localStorage has ~5-10MB limit
- **Network:** Make sure you're always on Somnia Testnet (Chain ID: 50312)
- **Console:** Keep browser console open to see all activity

---

## ✅ Success Criteria

Your app is working correctly if:
- ✅ Messages persist after page refresh
- ✅ Messages appear in real-time (within 10-15 seconds)
- ✅ Transaction links work
- ✅ No crashes or blocking errors
- ✅ Schema registration doesn't prevent usage
- ✅ Multiple messages display correctly

Happy Testing! 🚀

