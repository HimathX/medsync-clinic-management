# 🏥 MedSync - Clinic Management System

[![Status](https://img.shields.io/badge/Status-In%20Development-yellow)](https://github.com/HimathX/medsync-clinic-management)
[![MySQL](https://img.shields.io/badge/Database-MySQL-blue)](https://www.mysql.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB)](https://reactjs.org/)

> A comprehensive web-based healthcare management system for multi-specialty clinics with multiple branches.

![MedSync Banner](docs/ERD%20Diagram.png)

## 📋 Table of Contents
- [About](#about)
- [What It Does](#what-it-does)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Project Status](#project-status)
- [Team](#team)
- [Development Timeline](#development-timeline)

## 🔍 About

MedSync is designed for medium-scale clinics operating across multiple locations. Currently being developed for MedSync clinic branches in Colombo, Kandy, and Galle to replace their existing paper-based and Excel sheet management system.

## 💼 What It Does

<details>
<summary><b>👤 For Patients</b></summary>
<ul>
  <li>Register at any branch and access records from all locations</li>
  <li>Schedule appointments with doctors</li>
  <li>View treatment history and bills</li>
  <li>Make payments (full or partial)</li>
</ul>
</details>

<details>
<summary><b>👨‍⚕️ For Medical Staff</b></summary>
<ul>
  <li>View and manage patient appointments</li>
  <li>Record consultation notes after appointments</li>
  <li>Prescribe treatments from a standard catalogue</li>
  <li>Access patient medical history across branches</li>
</ul>
</details>

<details>
<summary><b>👩‍💼 For Administrative Staff</b></summary>
<ul>
  <li>Register new patients</li>
  <li>Schedule and reschedule appointments</li>
  <li>Process billing and payments</li>
  <li>Handle insurance claims</li>
  <li>Generate various management reports</li>
</ul>
</details>

<details>
<summary><b>📊 For Management</b></summary>
<ul>
  <li>View branch-wise appointment summaries</li>
  <li>Track doctor performance and revenue</li>
  <li>Monitor outstanding patient balances</li>
  <li>Analyze treatment statistics</li>
  <li>Review insurance coverage vs out-of-pocket payments</li>
</ul>
</details>

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🌐 **Multi-Branch Support** | Patient records accessible from any branch |
| 📅 **Smart Scheduling** | Prevents double-booking of doctors automatically |
| 📋 **Treatment Catalogue** | Standardized treatments with fixed pricing |
| 💰 **Flexible Billing** | Supports partial payments and tracks outstanding balances |
| 🏥 **Insurance Integration** | Handles insurance claims and reimbursements |
| 🚑 **Emergency Walk-ins** | Quick registration for urgent appointments |
| 📊 **Comprehensive Reporting** | Management dashboards and analytics |

## 🛠️ Technology Stack

<table>
  <tr>
    <td align="center"><img src="https://img.icons8.com/color/48/000000/react-native.png" width="30"/><br><b>React</b></td>
    <td>Modern, component-based UI framework for building interactive user interfaces</td>
  </tr>
  <tr>
    <td align="center"><img src="https://fastapi.tiangolo.com/img/favicon.png" width="30"/><br><b>FastAPI</b></td>
    <td>High-performance Python framework for building APIs with automatic documentation</td>
  </tr>
  <tr>
    <td align="center"><img src="https://img.icons8.com/fluency/48/000000/mysql-logo.png" width="30"/><br><b>MySQL</b></td>
    <td>Relational database for reliable and structured data storage</td>
  </tr>
</table>

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/HimathX/medsync-clinic-management.git
cd medsync-clinic-management

# Backend setup (requires Python 3.8+)
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend setup (requires Node.js)
cd ../frontend
npm install
npm start
```

## 📌 Project Status

<p align="center">
  <img src="https://img.shields.io/badge/Phase-1%20Database%20Design-blue" alt="Project Phase"/>
  <br>
  🚧 <b>Currently in Development</b> 🚧
</p>

This project is being developed as part of a database systems course. The focus is on creating a robust database design with proper relationships, constraints, and procedures to ensure data integrity.

## 👥 Team

<p align="center"><b>Group 06</b></p>

<table align="center">
  <tr>
    <td align="center">👨‍💻 DHANAPALA D.H.N</td>
    <td>230139N</td>
  </tr>
  <tr>
    <td align="center">👨‍💻 JEGARASHAN B.</td>
    <td>230304R</td>
  </tr>
  <tr>
    <td align="center">👨‍💻 MALAVIPATHIRANA H.H</td>
    <td>230389E</td>
  </tr>
  <tr>
    <td align="center">👨‍💻 NETHMINA L.T.H</td>
    <td>230429E</td>
  </tr>
  <tr>
    <td align="center">👨‍💻 WITHANAGE M.H</td>
    <td>230736R</td>
  </tr>
</table>

## 📋 Development Timeline

<div align="center">
  <table>
    <tr>
      <th>Phase</th>
      <th>Focus</th>
      <th>Status</th>
    </tr>
    <tr>
      <td>Phase 1</td>
      <td>Database design and core functionality</td>
      <td>🔄 Current</td>
    </tr>
    <tr>
      <td>Phase 2</td>
      <td>API development with FastAPI</td>
      <td>⏳ Pending</td>
    </tr>
    <tr>
      <td>Phase 3</td>
      <td>React frontend development</td>
      <td>⏳ Pending</td>
    </tr>
    <tr>
      <td>Phase 4</td>
      <td>Integration and testing</td>
      <td>⏳ Pending</td>
    </tr>
  </table>
</div>

## 📝 Documentation

For detailed documentation, please refer to:
- [Entity Relationship Diagram](docs/ERD%20Diagram.png)
- [System Requirements](docs/Problem%20-%20Clinic%20Appointment%20and%20Treatment%20Management%20System.pdf)
- [System Specifications](docs/MedSync%20Clinic%20Appointment%20and%20Treatment%20Management%20System%20.docx)

---

<p align="center">
  <i>Last Updated: September 2025</i><br>
  <a href="https://github.com/HimathX/medsync-clinic-management">GitHub Repository</a> • 
  <a href="LICENSE">License</a>
</p>