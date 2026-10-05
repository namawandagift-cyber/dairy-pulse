# DairyPulse V1 - Google Apps Script Backend Setup

DairyPulse uses Google Sheets as its sole database, connected through a Google Apps Script Web App.

---

## 1. Create Google Sheet

1. Go to [Google Sheets](https://sheets.new) and create a new spreadsheet.
2. Name it **DairyPulse Database**.
3. (Optional) You do not need to manually create the tabs or headers; the script's `ensureAllSheets` will automatically create the 8 required sheets and column headers upon initial call:
   - `Users`
   - `Farms`
   - `MilkRecords`
   - `Expenses`
   - `Buyers`
   - `Sales`
   - `Sessions`
   - `Activity`

---

## 2. Install the Script in Google Apps Script

1. In your Google Sheet, click **Extensions** > **Apps Script**.
2. Erase any placeholder code in `Code.gs`.
3. Copy the entire contents of `google-apps-script/Code.gs` and paste it into the editor.
4. Click the **Save** icon (disk icon) or press `Ctrl + S` / `Cmd + S`.

---

## 3. Deploy as a Web App

1. In the top-right of Apps Script, click **Deploy** > **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in the deployment configuration:
   - **Description**: `DairyPulse V1 API`
   - **Execute as**: `Me (your email)`
   - **Who has access**: `Anyone` *(Crucial so the application can communicate with the backend)*
4. Click **Deploy**.
5. Grant necessary permissions (Review permissions > Choose your Google account > Advanced > Go to DairyPulse (unsafe) > Allow).
6. Copy the **Web App URL** (format: `https://script.google.com/macros/s/AKfycb.../exec`).

---

## 4. Configure DairyPulse

Set the Web App URL in your DairyPulse environment:
- In `.env` or cloud deployment environment variables:
  ```env
  APPS_SCRIPT_URL="https://script.google.com/macros/s/[YOUR_DEPLOYMENT_ID]/exec"
  ```

---

## 5. Sheet Columns Reference

| Sheet | Columns |
|---|---|
| **Users** | `id`, `farmId`, `name`, `email`, `phone`, `passwordHash`, `role`, `status`, `createdAt`, `updatedAt` |
| **Farms** | `id`, `name`, `location`, `phone`, `description`, `status`, `createdAt`, `createdBy` |
| **MilkRecords** | `id`, `farmId`, `recordedBy`, `date`, `morningLitres`, `eveningLitres`, `totalLitres`, `notes`, `createdAt`, `updatedAt` |
| **Expenses** | `id`, `farmId`, `date`, `category`, `amount`, `description`, `recordedBy`, `createdAt` |
| **Buyers** | `id`, `farmId`, `name`, `phone`, `location`, `notes`, `createdAt` |
| **Sales** | `id`, `farmId`, `buyerId`, `buyerName`, `date`, `quantityLitres`, `pricePerLitre`, `totalAmount`, `recordedBy`, `createdAt` |
| **Sessions** | `token`, `userId`, `farmId`, `role`, `createdAt`, `expiresAt` |
| **Activity** | `id`, `farmId`, `userId`, `action`, `details`, `timestamp` |
