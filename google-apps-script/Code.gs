/**
 * DairyPulse V1 - Google Apps Script Backend
 * 
 * Google Sheets ONLY Persistence Layer
 * Sheets required: Users, Farms, MilkRecords, Expenses, Buyers, Sales, Sessions, Activity
 * 
 * Web App Deployment Settings:
 * 1. Click "Deploy" -> "New deployment"
 * 2. Select type: "Web app"
 * 3. Description: "DairyPulse V1 API"
 * 4. Execute as: "Me" (your Google account)
 * 5. Who has access: "Anyone"
 * 6. Click "Deploy" and copy the Web App URL (ends with /exec)
 * 7. Set APPS_SCRIPT_URL in your DairyPulse environment.
 */

// Define expected headers for each sheet
const SCHEMA = {
  Users: ['id', 'farmId', 'name', 'email', 'phone', 'passwordHash', 'role', 'status', 'createdAt', 'updatedAt'],
  Farms: ['id', 'name', 'location', 'phone', 'description', 'status', 'createdAt', 'createdBy'],
  MilkRecords: ['id', 'farmId', 'recordedBy', 'date', 'morningLitres', 'eveningLitres', 'totalLitres', 'notes', 'createdAt', 'updatedAt'],
  Expenses: ['id', 'farmId', 'date', 'category', 'amount', 'description', 'recordedBy', 'createdAt'],
  Buyers: ['id', 'farmId', 'name', 'phone', 'location', 'notes', 'createdAt'],
  Sales: ['id', 'farmId', 'buyerId', 'buyerName', 'date', 'quantityLitres', 'pricePerLitre', 'totalAmount', 'recordedBy', 'createdAt'],
  Sessions: ['token', 'userId', 'farmId', 'role', 'createdAt', 'expiresAt'],
  Activity: ['id', 'farmId', 'userId', 'action', 'details', 'timestamp']
};

/**
 * Handle GET requests (Health check / Ping)
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    return createJsonResponse({
      success: true,
      message: "DairyPulse Google Apps Script API is running.",
      spreadsheetName: ss.getName(),
      sheets: ss.getSheets().map(s => s.getName()),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: "Error accessing DairyPulse spreadsheet: " + err.toString()
    });
  }
}

/**
 * Handle POST requests (Core API router)
 */
function doPost(e) {
  // Use a lock to prevent race conditions during concurrent writes
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // wait up to 10 seconds for concurrent write
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: "Server is busy. Please try again in a few moments."
    });
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: "Empty request payload." });
    }

    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return createJsonResponse({ success: false, error: "Invalid JSON payload: " + parseErr.message });
    }

    const action = payload.action;
    if (!action) {
      return createJsonResponse({ success: false, error: "Missing 'action' parameter in request." });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureAllSheets(ss);

    // Route actions
    switch (action) {
      case "ping":
        return createJsonResponse({ success: true, message: "DairyPulse API connected." });

      case "initDatabase":
        return handleInitDatabase(ss);

      case "register":
        return handleRegister(ss, payload);

      case "login":
        return handleLogin(ss, payload);

      case "validateSession":
        return handleValidateSession(ss, payload);

      case "logout":
        return handleLogout(ss, payload);

      case "getFarmDetails":
        return handleGetFarmDetails(ss, payload);

      case "updateFarmDetails":
        return handleUpdateFarmDetails(ss, payload);

      case "getFarmUsers":
        return handleGetFarmUsers(ss, payload);

      case "createHerdsman":
        return handleCreateHerdsman(ss, payload);

      case "getMilkRecords":
        return handleGetMilkRecords(ss, payload);

      case "createMilkRecord":
        return handleCreateMilkRecord(ss, payload);

      case "getExpenses":
        return handleGetExpenses(ss, payload);

      case "createExpense":
        return handleCreateExpense(ss, payload);

      case "getBuyers":
        return handleGetBuyers(ss, payload);

      case "createBuyer":
        return handleCreateBuyer(ss, payload);

      case "getSales":
        return handleGetSales(ss, payload);

      case "createSale":
        return handleCreateSale(ss, payload);

      case "getDashboardSummary":
        return handleGetDashboardSummary(ss, payload);

      default:
        return createJsonResponse({ success: false, error: "Unknown action: " + action });
    }
  } catch (globalErr) {
    return createJsonResponse({
      success: false,
      error: "Unexpected server error: " + globalErr.toString()
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {
      // Ignored if lock was not held
    }
  }
}

// ==========================================
// SHEET INITIALIZATION & HELPER FUNCTIONS
// ==========================================

function getOrCreateSheet(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
  } else {
    // Check if headers row exists
    if (sheet.getLastRow() === 0 && headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function ensureAllSheets(ss) {
  for (const sheetName in SCHEMA) {
    getOrCreateSheet(ss, sheetName, SCHEMA[sheetName]);
  }
}

function getRowsAsObjects(sheet, headers) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const lastCol = headers.length;
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  return values.map((row, rowIndex) => {
    const obj = { _rowNumber: rowIndex + 2 };
    headers.forEach((h, colIndex) => {
      let val = row[colIndex];
      // Normalize dates to ISO string
      if (val instanceof Date) {
        val = val.toISOString();
      }
      obj[h] = val;
    });
    return obj;
  });
}

function appendObjectAsRow(sheet, headers, obj) {
  const rowData = headers.map(h => {
    let val = obj[h];
    if (val === undefined || val === null) return "";
    return val;
  });
  sheet.appendRow(rowData);
}

function updateRowByObject(sheet, headers, rowNumber, obj) {
  const rowData = headers.map(h => {
    let val = obj[h];
    if (val === undefined || val === null) return "";
    return val;
  });
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([rowData]);
}

function hashPassword(password) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  let hashStr = "";
  for (let i = 0; i < rawHash.length; i++) {
    let byteVal = rawHash[i];
    if (byteVal < 0) byteVal += 256;
    let byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = "0" + byteHex;
    hashStr += byteHex;
  }
  return hashStr;
}

function generateId(prefix) {
  const rand = Math.floor(Math.random() * 1000000).toString(36);
  return (prefix || 'id') + '_' + new Date().getTime().toString(36) + '_' + rand;
}

function logActivity(ss, farmId, userId, action, details) {
  try {
    const sheet = getOrCreateSheet(ss, "Activity", SCHEMA.Activity);
    appendObjectAsRow(sheet, SCHEMA.Activity, {
      id: generateId("act"),
      farmId: farmId || "",
      userId: userId || "",
      action: action || "",
      details: typeof details === "object" ? JSON.stringify(details) : String(details || ""),
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    // Activity logging should not fail the main request
  }
}

/**
 * Authentication and Farm Isolation Verifier
 * Returns { user, farm, session } or throws Error
 */
function authenticateSession(ss, token, allowedRoles) {
  if (!token) {
    throw new Error("Authentication required. Please log in.");
  }

  const sessionsSheet = getOrCreateSheet(ss, "Sessions", SCHEMA.Sessions);
  const sessions = getRowsAsObjects(sessionsSheet, SCHEMA.Sessions);
  const session = sessions.find(s => s.token === token);

  if (!session) {
    throw new Error("Invalid or expired session. Please log in again.");
  }

  // Check expiration if set
  if (session.expiresAt) {
    const expDate = new Date(session.expiresAt);
    if (expDate.getTime() < new Date().getTime()) {
      throw new Error("Session has expired. Please log in again.");
    }
  }

  // Lookup User
  const usersSheet = getOrCreateSheet(ss, "Users", SCHEMA.Users);
  const users = getRowsAsObjects(usersSheet, SCHEMA.Users);
  const user = users.find(u => u.id === session.userId && String(u.status).toUpperCase() === "ACTIVE");

  if (!user) {
    throw new Error("User account not found or deactivated.");
  }

  // Lookup Farm
  const farmsSheet = getOrCreateSheet(ss, "Farms", SCHEMA.Farms);
  const farms = getRowsAsObjects(farmsSheet, SCHEMA.Farms);
  const farm = farms.find(f => f.id === user.farmId);

  if (!farm) {
    throw new Error("Associated farm not found.");
  }

  // Check role authorization if specified
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      throw new Error("Unauthorized action for user role: " + user.role);
    }
  }

  // Strip password hash
  delete user.passwordHash;

  return { session, user, farm };
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// ACTION HANDLERS
// ==========================================

function handleInitDatabase(ss) {
  ensureAllSheets(ss);
  return createJsonResponse({
    success: true,
    message: "DairyPulse database initialized successfully with all 8 sheets.",
    sheets: Object.keys(SCHEMA)
  });
}

function handleRegister(ss, payload) {
  const { name, email, phone, password, farmName, farmLocation, farmPhone, farmDescription } = payload;

  if (!name || !name.trim()) return createJsonResponse({ success: false, error: "Full name is required." });
  if (!email || !email.trim()) return createJsonResponse({ success: false, error: "Email is required." });
  if (!password || password.length < 6) return createJsonResponse({ success: false, error: "Password must be at least 6 characters." });
  if (!farmName || !farmName.trim()) return createJsonResponse({ success: false, error: "Farm name is required." });
  if (!farmLocation || !farmLocation.trim()) return createJsonResponse({ success: false, error: "Farm location is required." });

  const cleanEmail = email.trim().toLowerCase();

  // Check if email already registered
  const usersSheet = getOrCreateSheet(ss, "Users", SCHEMA.Users);
  const existingUsers = getRowsAsObjects(usersSheet, SCHEMA.Users);
  const found = existingUsers.find(u => String(u.email).toLowerCase() === cleanEmail);
  if (found) {
    return createJsonResponse({
      success: false,
      error: "An account with this email already exists. Please log in."
    });
  }

  const now = new Date().toISOString();
  const farmId = generateId("farm");
  const userId = generateId("user");
  const pwdHash = hashPassword(password);

  // 1. Create Farm Row
  const farmsSheet = getOrCreateSheet(ss, "Farms", SCHEMA.Farms);
  const farmRecord = {
    id: farmId,
    name: farmName.trim(),
    location: farmLocation.trim(),
    phone: (farmPhone || phone || "").trim(),
    description: (farmDescription || "").trim(),
    status: "ACTIVE",
    createdAt: now,
    createdBy: userId
  };
  appendObjectAsRow(farmsSheet, SCHEMA.Farms, farmRecord);

  // 2. Create User Row (role: OWNER)
  const userRecord = {
    id: userId,
    farmId: farmId,
    name: name.trim(),
    email: cleanEmail,
    phone: (phone || "").trim(),
    passwordHash: pwdHash,
    role: "OWNER",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now
  };
  appendObjectAsRow(usersSheet, SCHEMA.Users, userRecord);

  // 3. Create Session Token (Valid 30 days)
  const sessionToken = generateId("sess");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const sessionsSheet = getOrCreateSheet(ss, "Sessions", SCHEMA.Sessions);
  appendObjectAsRow(sessionsSheet, SCHEMA.Sessions, {
    token: sessionToken,
    userId: userId,
    farmId: farmId,
    role: "OWNER",
    createdAt: now,
    expiresAt: expiresAt
  });

  logActivity(ss, farmId, userId, "REGISTER", { farmName: farmRecord.name, email: cleanEmail });

  delete userRecord.passwordHash;

  return createJsonResponse({
    success: true,
    message: "Registration successful.",
    token: sessionToken,
    user: userRecord,
    farm: farmRecord
  });
}

function handleLogin(ss, payload) {
  const { email, password } = payload;
  if (!email || !password) {
    return createJsonResponse({ success: false, error: "Email and password are required." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const usersSheet = getOrCreateSheet(ss, "Users", SCHEMA.Users);
  const users = getRowsAsObjects(usersSheet, SCHEMA.Users);
  const user = users.find(u => String(u.email).toLowerCase() === cleanEmail);

  if (!user) {
    return createJsonResponse({ success: false, error: "Invalid email or password." });
  }

  if (String(user.status).toUpperCase() !== "ACTIVE") {
    return createJsonResponse({ success: false, error: "Your account is inactive. Please contact your farm owner." });
  }

  const inputHash = hashPassword(password);
  if (user.passwordHash !== inputHash) {
    return createJsonResponse({ success: false, error: "Invalid email or password." });
  }

  // Lookup farm
  const farmsSheet = getOrCreateSheet(ss, "Farms", SCHEMA.Farms);
  const farms = getRowsAsObjects(farmsSheet, SCHEMA.Farms);
  const farm = farms.find(f => f.id === user.farmId);

  if (!farm) {
    return createJsonResponse({ success: false, error: "Associated farm could not be found." });
  }

  // Create new session token
  const now = new Date().toISOString();
  const sessionToken = generateId("sess");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const sessionsSheet = getOrCreateSheet(ss, "Sessions", SCHEMA.Sessions);
  appendObjectAsRow(sessionsSheet, SCHEMA.Sessions, {
    token: sessionToken,
    userId: user.id,
    farmId: user.farmId,
    role: user.role,
    createdAt: now,
    expiresAt: expiresAt
  });

  logActivity(ss, user.farmId, user.id, "LOGIN", { email: cleanEmail });

  const safeUser = { ...user };
  delete safeUser.passwordHash;
  delete safeUser._rowNumber;

  return createJsonResponse({
    success: true,
    message: "Login successful.",
    token: sessionToken,
    user: safeUser,
    farm: farm
  });
}

function handleValidateSession(ss, payload) {
  try {
    const auth = authenticateSession(ss, payload.token);
    return createJsonResponse({
      success: true,
      user: auth.user,
      farm: auth.farm
    });
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: err.message
    });
  }
}

function handleLogout(ss, payload) {
  const { token } = payload;
  if (!token) return createJsonResponse({ success: true });

  const sessionsSheet = getOrCreateSheet(ss, "Sessions", SCHEMA.Sessions);
  const lastRow = sessionsSheet.getLastRow();
  if (lastRow > 1) {
    const tokens = sessionsSheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i][0] === token) {
        sessionsSheet.deleteRow(i + 2);
        break;
      }
    }
  }

  return createJsonResponse({ success: true, message: "Logged out successfully." });
}

function handleGetFarmDetails(ss, payload) {
  try {
    const auth = authenticateSession(ss, payload.token);
    return createJsonResponse({
      success: true,
      farm: auth.farm
    });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message });
  }
}

function handleUpdateFarmDetails(ss, payload) {
  try {
    const auth = authenticateSession(ss, payload.token, ["OWNER"]);
    const { name, location, phone, description } = payload;

    if (!name || !name.trim()) return createJsonResponse({ success: false, error: "Farm name cannot be empty." });
    if (!location || !location.trim()) return createJsonResponse({ success: false, error: "Farm location cannot be empty." });

    const farmsSheet = getOrCreateSheet(ss, "Farms", SCHEMA.Farms);
    const farms = getRowsAsObjects(farmsSheet, SCHEMA.Farms);
    const farmRow = farms.find(f => f.id === auth.farm.id);

    if (!farmRow) {
      return createJsonResponse({ success: false, error: "Farm record not found." });
    }

    farmRow.name = name.trim();
    farmRow.location = location.trim();
    farmRow.phone = (phone || "").trim();
    farmRow.description = (description || "").trim();

    updateRowByObject(farmsSheet, SCHEMA.Farms, farmRow._rowNumber, farmRow);
    delete farmRow._rowNumber;

    logActivity(ss, auth.farm.id, auth.user.id, "UPDATE_FARM", { name: farmRow.name });

    return createJsonResponse({
      success: true,
      message: "Farm details updated.",
      farm: farmRow
    });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message });
  }
}

function handleGetFarmUsers(ss, payload) {
  try {
    const auth = authenticateSession(ss, payload.token, ["OWNER"]);
    const usersSheet = getOrCreateSheet(ss, "Users", SCHEMA.Users);
    const users = getRowsAsObjects(usersSheet, SCHEMA.Users);

    // Strict farm isolation
    const farmUsers = users
      .filter(u => u.farmId === auth.farm.id)
      .map(u => ({
        id: u.id,
        farmId: u.farmId,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt
      }));

    return createJsonResponse({
      success: true,
      users: farmUsers
    });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message });
  }
}

function handleCreateHerdsman(ss, payload) {
  try {
    const auth = authenticateSession(ss, payload.token, ["OWNER"]);
    const { name, email, phone, password } = payload;

    if (!name || !name.trim()) return createJsonResponse({ success: false, error: "Herdsman name is required." });
    if (!email || !email.trim()) return createJsonResponse({ success: false, error: "Herdsman email is required." });
    if (!password || password.length < 6) return createJsonResponse({ success: false, error: "Password must be at least 6 characters." });

    const cleanEmail = email.trim().toLowerCase();
    const usersSheet = getOrCreateSheet(ss, "Users", SCHEMA.Users);
    const users = getRowsAsObjects(usersSheet, SCHEMA.Users);

    if (users.some(u => String(u.email).toLowerCase() === cleanEmail)) {
      return createJsonResponse({ success: false, error: "A user with this email already exists." });
    }

    const now = new Date().toISOString();
    const userId = generateId("user");
    const userRecord = {
      id: userId,
      farmId: auth.farm.id, // Strictly tied to owner's farm
      name: name.trim(),
      email: cleanEmail,
      phone: (phone || "").trim(),
      passwordHash: hashPassword(password),
      role: "HERDSMAN",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now
    };

    appendObjectAsRow(usersSheet, SCHEMA.Users, userRecord);
    logActivity(ss, auth.farm.id, auth.user.id, "CREATE_HERDSMAN", { name: userRecord.name, email: cleanEmail });

    const safeUser = { ...userRecord };
    delete safeUser.passwordHash;

    return createJsonResponse({
      success: true,
      message: "Herdsman account created successfully.",
      user: safeUser
    });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message });
  }
}

function handleGetMilkRecords(ss, payload) {
  try {
    const auth = authenticateSession(ss, payload.token);
    const milkSheet = getOrCreateSheet(ss, "MilkRecords", SCHEMA.MilkRecords);
    const allRecords = getRowsAsObjects(milkSheet, SCHEMA.MilkRecords);

    // Strict farm isolation
    let farmRecords = allRecords.filter(r => r.farmId === auth.farm.id);

    // Sort by date descending, then createdAt descending
    farmRecords.sort((a, b) => {
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;
      if (dateB !== dateA) return dateB - dateA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Clean up row internal tracker
    farmRecords = farmRecords.map(r => {
      const clean = { ...r };
      delete clean._rowNumber;
      return clean;
    });

    return createJsonResponse({
      success: true,
      records: farmRecords
    });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message });
  }
}

function handleCreateMilkRecord(ss, payload) {
  try {
    const auth = authenticateSession(ss, payload.token);
    const { date, morningLitres, eveningLitres, notes } = payload;

    if (!date) return createJsonResponse({ success: false, error: "Date is required." });

    const morning = parseFloat(morningLitres) || 0;
    const evening = parseFloat(eveningLitres) || 0;

    if (morning < 0 || evening < 0) {
      return createJsonResponse({ success: false, error: "Litres cannot be negative." });
    }

    if (morning === 0 && evening === 0) {
      return createJsonResponse({ success: false, error: "Please enter morning or evening litres (or both)." });
    }

    const total = Math.round((morning + evening) * 100) / 100;
    const now = new Date().toISOString();
    const id = generateId("milk");

    const record = {
      id: id,
      farmId: auth.farm.id, // Strictly derived from session
      recordedBy: auth.user.name,
      date: date,
      morningLitres: morning,
      eveningLitres: evening,
      totalLitres: total,
      notes: (notes || "").trim(),
      createdAt: now,
      updatedAt: now
    };

    const milkSheet = getOrCreateSheet(ss, "MilkRecords", SCHEMA.MilkRecords);
    appendObjectAsRow(milkSheet, SCHEMA.MilkRecords, record);

    logActivity(ss, auth.farm.id, auth.user.id, "RECORD_MILK", { date: date, totalLitres: total });

    return createJsonResponse({
      success: true,
      message: "Milk record saved successfully.",
      record: record
    });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message });
  }
}

function handleGetExpenses(ss, payload) {
  try {
    const auth = authenticateSession(ss, payload.token, ["OWNER"]);
    const sheet = getOrCreateSheet(ss, "Expenses", SCHEMA.Expenses);
    const allExpenses = getRowsAsObjects(sheet, SCHEMA.Expenses);

    const farmExpenses = allExpenses
      .filter(e => e.farmId === auth.farm.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(e => {
        const clean = { ...e };
        delete clean._rowNumber;
        return clean;
      });

    return createJsonResponse({
      success: true,
      expenses: farmExpenses
    });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message });
  }
}

function handleCreateExpense(ss, payload) {
  try {
    const auth = authenticateSession(ss, payload.token, ["OWNER"]);
    const { date, category, amount, description } = payload;

    if (!date) return createJsonResponse({ success: false, error: "Date is required." });
    if (!category || !category.trim()) return createJsonResponse({ success: false, error: "Category is required." });

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return createJsonResponse({ success: false, error: "Amount must be a valid positive number." });
    }

    const now = new Date().toISOString();
    const id = generateId("exp");

    const record = {
      id: id,
      farmId: auth.farm.id,
      date: date,
      category: category.trim(),
      amount: amt,
      description: (description || "").trim(),
      recordedBy: auth.user.name,
      createdAt: now
    };

    const sheet = getOrCreateSheet(ss, "Expenses", SCHEMA.Expenses);
    appendObjectAsRow(sheet, SCHEMA.Expenses, record);

    logActivity(ss, auth.farm.id, auth.user.id, "RECORD_EXPENSE", { category: category, amount: amt });

    return createJsonResponse({
      success: true,
      message: "Expense saved successfully.",
      expense: record
    });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message });
  }
}

function handleGetBuyers(ss, payload) {
  try {
    const auth = authenticateSession(ss, payload.token, ["OWNER"]);
    const sheet = getOrCreateSheet(ss, "Buyers", SCHEMA.Buyers);
    const allBuyers = getRowsAsObjects(sheet, SCHEMA.Buyers);

    const farmBuyers = allBuyers
      .filter(b => b.farmId === auth.farm.id)
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      .map(b => {
        const clean = { ...b };
        delete clean._rowNumber;
        return clean;
      });

    return createJsonResponse({
      success: true,
      buyers: farmBuyers
    });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message });
  }
}

function handleCreateBuyer(ss, payload) {
  try {
    const auth = authenticateSession(ss, payload.token, ["OWNER"]);
    const { name, phone, location, notes } = payload;

    if (!name || !name.trim()) return createJsonResponse({ success: false, error: "Buyer name is required." });

    const now = new Date().toISOString();
    const id = generateId("buyer");

    const record = {
      id: id,
      farmId: auth.farm.id,
      name: name.trim(),
      phone: (phone || "").trim(),
      location: (location || "").trim(),
      notes: (notes || "").trim(),
      createdAt: now
    };

    const sheet = getOrCreateSheet(ss, "Buyers", SCHEMA.Buyers);
    appendObjectAsRow(sheet, SCHEMA.Buyers, record);

    logActivity(ss, auth.farm.id, auth.user.id, "CREATE_BUYER", { name: record.name });

    return createJsonResponse({
      success: true,
      message: "Buyer added successfully.",
      buyer: record
    });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message });
  }
}

function handleGetSales(ss, payload) {
  try {
    const auth = authenticateSession(ss, payload.token, ["OWNER"]);
    const sheet = getOrCreateSheet(ss, "Sales", SCHEMA.Sales);
    const allSales = getRowsAsObjects(sheet, SCHEMA.Sales);

    const farmSales = allSales
      .filter(s => s.farmId === auth.farm.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(s => {
        const clean = { ...s };
        delete clean._rowNumber;
        return clean;
      });

    return createJsonResponse({
      success: true,
      sales: farmSales
    });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message });
  }
}

function handleCreateSale(ss, payload) {
  try {
    const auth = authenticateSession(ss, payload.token, ["OWNER"]);
    const { buyerId, buyerName, date, quantityLitres, pricePerLitre } = payload;

    if (!date) return createJsonResponse({ success: false, error: "Date is required." });
    if (!buyerName || !buyerName.trim()) return createJsonResponse({ success: false, error: "Buyer name is required." });

    const qty = parseFloat(quantityLitres);
    const price = parseFloat(pricePerLitre);

    if (isNaN(qty) || qty <= 0) {
      return createJsonResponse({ success: false, error: "Quantity in litres must be a positive number." });
    }
    if (isNaN(price) || price <= 0) {
      return createJsonResponse({ success: false, error: "Price per litre must be a positive number." });
    }

    const totalAmount = Math.round(qty * price * 100) / 100;
    const now = new Date().toISOString();
    const id = generateId("sale");

    const record = {
      id: id,
      farmId: auth.farm.id,
      buyerId: buyerId || "",
      buyerName: buyerName.trim(),
      date: date,
      quantityLitres: qty,
      pricePerLitre: price,
      totalAmount: totalAmount,
      recordedBy: auth.user.name,
      createdAt: now
    };

    const sheet = getOrCreateSheet(ss, "Sales", SCHEMA.Sales);
    appendObjectAsRow(sheet, SCHEMA.Sales, record);

    logActivity(ss, auth.farm.id, auth.user.id, "RECORD_SALE", { buyerName: record.buyerName, totalAmount: totalAmount });

    return createJsonResponse({
      success: true,
      message: "Sale recorded successfully.",
      sale: record
    });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message });
  }
}

function handleGetDashboardSummary(ss, payload) {
  try {
    const auth = authenticateSession(ss, payload.token, ["OWNER"]);
    const farmId = auth.farm.id;
    const todayStr = payload.todayDate || new Date().toISOString().slice(0, 10);

    // 1. Milk Records
    const milkSheet = getOrCreateSheet(ss, "MilkRecords", SCHEMA.MilkRecords);
    const milkRows = getRowsAsObjects(milkSheet, SCHEMA.MilkRecords).filter(r => r.farmId === farmId);

    let totalMilk = 0;
    let todayMilk = 0;

    milkRows.forEach(r => {
      const litres = parseFloat(r.totalLitres) || 0;
      totalMilk += litres;
      // Match date string (YYYY-MM-DD)
      const recordDate = String(r.date || "").slice(0, 10);
      if (recordDate === todayStr) {
        todayMilk += litres;
      }
    });

    // Recent 5 milk records
    milkRows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recentMilk = milkRows.slice(0, 5).map(r => {
      const clean = { ...r };
      delete clean._rowNumber;
      return clean;
    });

    // 2. Sales
    const salesSheet = getOrCreateSheet(ss, "Sales", SCHEMA.Sales);
    const salesRows = getRowsAsObjects(salesSheet, SCHEMA.Sales).filter(s => s.farmId === farmId);

    let milkSold = 0;
    let salesTotal = 0;

    salesRows.forEach(s => {
      const qty = parseFloat(s.quantityLitres) || 0;
      const amt = parseFloat(s.totalAmount) || 0;
      milkSold += qty;
      salesTotal += amt;
    });

    salesRows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recentSales = salesRows.slice(0, 5).map(s => {
      const clean = { ...s };
      delete clean._rowNumber;
      return clean;
    });

    // 3. Expenses
    const expensesSheet = getOrCreateSheet(ss, "Expenses", SCHEMA.Expenses);
    const expenseRows = getRowsAsObjects(expensesSheet, SCHEMA.Expenses).filter(e => e.farmId === farmId);

    let expensesTotal = 0;
    expenseRows.forEach(e => {
      const amt = parseFloat(e.amount) || 0;
      expensesTotal += amt;
    });

    expenseRows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recentExpenses = expenseRows.slice(0, 5).map(e => {
      const clean = { ...e };
      delete clean._rowNumber;
      return clean;
    });
    return createJsonResponse({
      success: true,
      summary: {
        todayMilk: Math.round(todayMilk * 100) / 100,
        totalMilk: Math.round(totalMilk * 100) / 100,
        milkSold: Math.round(milkSold * 100) / 100,
        salesTotal: Math.round(salesTotal * 100) / 100,
        expensesTotal: Math.round(expensesTotal * 100) / 100,
        recentMilkRecords: recentMilk,
        recentSales: recentSales,
        recentExpenses: recentExpenses
      }
    });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message });
  }
}
