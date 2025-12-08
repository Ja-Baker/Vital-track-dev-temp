# VitalTrack Feature Specifications

## User Roles & Permissions

### Admin
| Permission | Access |
|------------|--------|
| View all facilities | Yes |
| Manage facilities | Yes |
| Add/remove residents | Yes |
| Add/remove caregivers | Yes |
| Add/remove family members | Yes |
| Configure alert thresholds | Yes (facility-wide & per-resident) |
| Manage watch assignments | Yes |
| View device health | Yes |
| View all dashboards | Yes |
| View analytics | Yes |
| Manage user accounts | Yes |
| Export data | Yes |
| View audit logs | Yes |

### Caregiver
| Permission | Access |
|------------|--------|
| View assigned facility residents | Yes |
| Real-time vital monitoring | Yes |
| Receive alerts | Yes |
| Acknowledge alerts | Yes |
| Resolve alerts | Yes |
| Document care actions | Yes |
| Trigger manual check-ins | Yes |
| View watch status | Yes |
| Modify resident assignments | No |
| Modify thresholds | No |
| View other facilities | No |

### Next of Kin (Family)
| Permission | Access |
|------------|--------|
| View family member data | Yes (single resident only) |
| View vital trends | Yes (simplified) |
| View activity summary | Yes |
| Receive critical alerts | Yes |
| Receive non-critical alerts | No |
| View other residents | No |
| View facility-wide data | No |
| Message caregivers | Yes (optional) |
| Modify any data | No |

---

## Core Features

### 1. Real-Time Vitals Dashboard

#### Caregiver/Admin View
Display grid of all residents with:

**Resident Card Information:**
- Resident photo, name, age, room number
- Status indicator:
  - 🟢 Green: All vitals normal
  - 🟡 Yellow: Warning threshold breached
  - 🔴 Red: Critical alert active
  - ⚫ Gray: No data >10 min (device offline)

**Current Vital Signs (updated every 30-60 sec):**
| Vital | Unit | Display |
|-------|------|---------|
| Heart Rate | BPM | Large number with trend arrow |
| HRV | ms | Color indicator (green=good) |
| SpO2 | % | With respiratory rate |
| Blood Pressure | mmHg | Systolic/Diastolic |
| Body Temperature | °F | Skin temperature |
| Respiratory Rate | breaths/min | Number |
| ECG Status | text | "Normal" / "Irregular" |
| Activity Level | steps | Steps today, active minutes |
| Sleep Score | 0-100 | Last night's quality |

**Fall Detection Status:**
- "No falls detected"
- "⚠️ FALL DETECTED - 3 min ago" with location

**GPS Location:**
- Map pin for current location
- "Last seen: Dining room" or "Outside facility - 0.3 mi away"

**Watch Status:**
- Battery level (%)
- Cellular signal strength (bars)
- Last data sync timestamp

#### Family View
Single resident view with:
- Same vital signs as above
- Activity summary (steps, sleep hours, time out of bed)
- Weekly trend graphs
- Last caregiver check-in timestamp
- Fall alerts and SOS events visible

---

### 2. Individual Resident Detail View

#### Profile Section
- Name, DOB, photo, room number
- Medical conditions, medications, allergies
- Emergency contacts

**Watch Assignment:**
- Device ID / IMEI
- SIM card number
- Activation date
- Cellular carrier
- Pairing status: "Active" / "Offline" / "Battery Critical"

#### Vitals Tab

**Real-time Current Readings (large, color-coded):**
- Heart Rate with trend arrow (↑↓→)
- HRV with color indicator
- SpO2 with respiratory rate
- Blood pressure with hypertension/hypotension warnings
- Skin temperature with fever detection
- ECG rhythm status

**Historical Graphs (interactive):**
- Toggle: Last 24 hours, 7 days, 30 days, Custom range
- Multi-line graph showing all vitals overlaid
- Zoom and pan capabilities
- Annotations for events (falls, SOS, medications)
- Export as CSV or PDF

#### Activity Tab

**Fall Detection Events:**
- List of all falls with timestamps
- Severity indicator (hard fall vs soft fall)
- Location where fall occurred
- Response time by caregiver
- Outcome documented

**GPS Tracking History:**
- Interactive map showing movements
- Geofence zones (facility boundary, safe zones, restricted areas)
- Alerts when leaving/entering zones
- Breadcrumb trail for last 24 hours

**Sleep Patterns:**
- Sleep graph (deep sleep, light sleep, REM, awake)
- Sleep score trend over 30 days
- Time in bed vs time asleep
- Wake events during night

**Activity Level Trends:**
- Daily steps chart
- Active vs sedentary time
- Comparison to baseline
- Decline detection alerts

#### Alerts Tab
- History of all alerts for resident
- Filter by: Type, Status, Date
- Each alert shows:
  - Timestamp and type
  - Status: Pending, Acknowledged, Resolved, False Alarm
  - Triggering vital reading
  - Caregiver who responded
  - Time to acknowledgment/resolution
  - Care notes

#### Care Log Tab
- Chronological log of caregiver interactions
- Medication administration times
- Vital check timestamps
- Incident reports
- Caregiver shift notes
- Photo uploads (wound care, etc.)

#### Device Health Tab
- Battery level history (7-day chart)
- Cellular signal strength over time
- Data transmission reliability (% successful)
- Firmware version
- Last sync timestamp
- Diagnostic info

**Remote Commands:**
- Force sync now
- Adjust monitoring frequency
- Locate device (trigger vibration/sound)
- Factory reset (admin only)

---

### 3. Alert System

#### Alert Types & Thresholds

**Critical (Red) - Immediate Response:**
| Trigger | Threshold |
|---------|-----------|
| SOS Button Pressed | Instant |
| Fall Detected | Accelerometer threshold |
| Heart Rate | < 40 BPM or > 130 BPM |
| SpO2 | < 88% |
| Blood Pressure Systolic | > 180 or < 90 |
| Blood Pressure Diastolic | > 110 or < 60 |
| ECG Irregular | AFib detection |
| No Vitals | >10 minutes |
| Left Geofence | Wandering detection |

**Warning (Yellow) - Monitor Closely:**
| Trigger | Threshold |
|---------|-----------|
| Heart Rate | 40-50 or 120-130 BPM |
| SpO2 | 88-92% |
| Blood Pressure Systolic | 160-180 or 90-100 |
| HRV | Below personal baseline |
| Temperature | > 99.5°F |
| Sleep | < 4 hours or fragmented |
| Activity | 50% below normal (2+ days) |
| Battery | < 20% |

**Info (Blue) - Routine:**
| Trigger | Threshold |
|---------|-----------|
| Battery | < 50% |
| Watch Removed | Skin contact lost 5+ min |
| Geofence Entry/Exit | Routine |
| Medication Reminder | Scheduled |
| Daily Report | Generated |

#### Alert Flow

```
1. Watch detects abnormal reading
2. Backend processes data, triggers alert
3. Alert appears in dashboard (popup + sound)
4. Push notification to caregiver app
5. SMS to on-duty caregiver (critical)
6. [SOS] Auto-dial facility emergency line
7. Caregiver clicks "Responding" with timestamp
8. System logs response time
9. Caregiver documents action taken
10. Caregiver marks "Resolved" or "False Alarm"
11. If not acknowledged in 3 min → escalate
12. Family gets notification (Critical only)
```

#### Escalation Rules
- Critical not acknowledged in 3 min → Notify admin + backup
- Critical not resolved in 15 min → Auto-call emergency contact
- Multiple warnings same resident → Escalate to critical
- 2+ falls in 24 hours → Notify admin + family

#### Alert Dashboard
- Filterable list of active/historical alerts
- Sort by: Time, Severity, Resident, Status, Response Time
- Bulk actions for acknowledged/resolved
- Statistics:
  - Average response time today/week
  - Alert frequency by type
  - False alarm rate
  - Most common triggers

---

### 4. Analytics & Trends

#### Admin Analytics

**Facility-wide Metrics:**
- Total residents monitored
- Residents with active alerts
- Average vital scores across facility
- Trending health issues

**Response Metrics:**
- Average time to acknowledge
- Average time to resolve
- Alert volume by hour (heatmap)
- Caregiver performance leaderboard

**Fall Analytics:**
- Total falls this week/month
- Fall locations (bathroom, bedroom, hallway)
- Time of day distribution
- Injury rate from falls
- Repeat fallers (3+ falls)

**Device Fleet Health:**
- Total watches deployed
- Watches online vs offline
- Average battery life
- Cellular connectivity issues
- Watches needing replacement

**Predictive Insights (ML-powered):**
- Residents at high fall risk (next 7 days)
- Declining health trends
- Unusual vital patterns

#### Caregiver Analytics

**Per-shift Summary:**
- Alerts handled during shift
- Residents checked on
- Average response time
- Outstanding alerts
- Handoff notes for next shift

**My Residents:**
- Quick view of all assigned
- Priority list (red/yellow first)

#### Family Analytics

**Weekly Health Email:**
- Summary of vital trends
- Notable events (falls, alerts)
- Activity highlights
- Sleep quality average
- Caregiver notes

**Monthly Trends:**
- Month-over-month comparisons
- Activity level changes
- Concerning patterns

---

### 5. Geofencing & Location

#### Geofence Setup (Admin)
- Draw boundary on map around facility
- Set multiple zones:
  - **Safe zone** (facility grounds) - green
  - **Restricted areas** (kitchen, maintenance) - yellow
  - **High-risk areas** (exits, stairwells) - orange
- Configure alerts per zone

#### Real-Time Location
- Map view of all GPS-enabled watches
- Breadcrumb trail of movements
- "Last seen" for each resident
- Filter: Show only residents outside facility

#### Wandering Detection
- Critical alert if dementia resident leaves geofence
- Alert includes:
  - Current GPS coordinates
  - Direction of travel
  - Speed (walking vs vehicle)
  - Distance from facility
  - "Find My" style map interface
- Mark as "Authorized outing" to stop alerts

---

### 6. Emergency SOS Workflow

#### When SOS Button Pressed:

**1. Watch Action:**
- Vibrates to confirm press
- LED flashes red
- Sends immediate POST to backend
- Records GPS location
- Transmits location every 10 seconds until acknowledged

**2. Backend Processing:**
- Creates CRITICAL alert
- Plays loud alarm on all caregiver devices
- Full-screen popup: "🚨 SOS - Mary Johnson - Room 101"
- Push notification to all on-duty caregivers
- SMS to charge nurse
- (Optional) Auto-dial facility emergency line

**3. Caregiver Response:**
- Clicks "Responding" button
- System sends confirmation vibration to watch
- Alert updates to "Acknowledged - [Name] responding"
- Timer tracks response time

**4. Resolution:**
- Caregiver arrives at resident
- Documents situation:
  - Dropdown: False alarm, Fall (no injury), Fall (injury), Emergency, Other
  - Free text notes
  - Photo upload option
- Marks "Resolved"
- Family notification: "SOS resolved by caregiver"

**5. Audit Trail:**
```
- SOS pressed at 10:30:15 AM
- Alert created at 10:30:16 AM
- Acknowledged by Jane (RN) at 10:31:02 AM (47 sec)
- Resolved at 10:35:30 AM
- Outcome: False alarm, resident confused
```

---

### 7. User Management

#### Admin Functions

**Facility Management:**
- Add new facility (name, address, timezone)
- Set facility-wide thresholds
- Upload facility floor plan

**User Invitations:**
- Invite caregiver: Email, facility, role (RN, CNA, Admin)
- Invite family: Email, specific resident
- Send invitation email with signup link

**Resident Management:**
- Add resident (full profile form)
- Assign watch to resident
- Set custom thresholds per resident
- Add/remove family members
- Deactivate resident (discharge)

**Bulk Operations:**
- Import residents from CSV
- Export all resident data
- Bulk assign watches

#### Caregiver Self-Service
- Update profile
- Set availability/shift schedule
- Notification preferences:
  - Email: On/Off
  - SMS: Critical only / All
  - Push: On/Off
  - Quiet hours (11pm-6am)

#### Family Features
- Update contact info
- Add additional family members
- Set notification preferences
- Request data export (HIPAA)

---

### 8. Device Management

#### Watch Activation Flow
```
1. Admin receives new watch shipment
2. Admin panel: "Add New Device"
3. Enter IMEI, SIM #, carrier
4. Assign to resident
5. System generates unique API key
6. Configure watch with API endpoint + key
7. Watch starts transmitting
8. Dashboard shows "✅ Device Online"
```

#### Watch Status Page
- List all watches with filters (online, offline, low battery)
- Per watch:
  - Device ID, resident name, room
  - Status badge: Online (green), Offline (red), Low Battery (yellow)
  - Battery level with charging indicator
  - Signal strength
  - Last data timestamp
  - Data transmission success rate
- Quick actions: View Details, Send Command, Unpair, Deactivate

#### Troubleshooting Tools
- Diagnostics page:
  - Sensor health (which sensors functioning)
  - Network diagnostics
  - Error log from watch
- Remote reboot capability
- Firmware update push

---

### 9. Reporting & Compliance

#### Automated Reports (Admin)

**Daily Facility Summary (email at 8am):**
- Total alerts yesterday
- Falls and responses
- Residents with concerning trends
- Device status (offline watches)
- Top 3 action items

**Weekly Health Report (PDF):**
- Per-resident vital summaries
- Alert volume trends
- Response time metrics
- Device battery health

**Monthly Compliance Report:**
- All critical events
- Response times (avg, min, max)
- False alarm rate
- Family notification log
- Incident summaries
- Device reliability stats

#### Exportable Data
- Resident vital history (CSV, PDF)
- Alert history with response times
- Care log entries
- Facility-wide analytics

#### Audit Logs (HIPAA)
- Log every user action:
  - Who logged in (timestamp, IP)
  - Who viewed which resident data
  - Who modified thresholds
  - Who acknowledged/resolved alerts
  - Data exports performed
- Searchable and filterable
- Retention: 7 years minimum

---

### 10. Mobile App Features

#### Caregiver Mobile App
- Receive push notifications
- View resident dashboard
- Acknowledge/resolve alerts
- Quick vital checks
- Document care notes
- Clock in/out for shifts

#### Family Mobile App
- Simplified view of loved one
- Push notifications for critical events
- Message caregivers
- View daily activity summary
- Photo sharing from caregivers
