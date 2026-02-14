<div align="center">

# ⚡ Day Planner

**A cyberpunk-themed study planner built for focused students.**

Plan your week. Track your progress. Own your schedule.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Mantine](https://img.shields.io/badge/Mantine-7-339AF0?style=flat-square&logo=mantine&logoColor=white)](https://mantine.dev)
[![License](https://img.shields.io/badge/License-MIT-8B5CF6?style=flat-square)](LICENSE)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📅 **Weekly Grid** | 7-day planner with 1-hour time slots, current time indicator, and week navigation |
| 🖱️ **Drag & Drop** | Rearrange tasks across days and time slots with visual feedback |
| 📊 **Analytics** | Study hours charts, weekly trends, category breakdown donut, and study streak counter |
| 📚 **Subjects & Chapters** | Track subjects with chapter completion status (Not Started → Mastered) and progress bars |
| ⚠️ **Backlog Tracking** | Per-subject overdue task counts with visual warnings |
| 🖨️ **Print** | Generate clean, formatted study schedule tables for printing |
| 💾 **Persistent Data** | All tasks, subjects, and chapters saved to localStorage — survives page refresh |
| 🎨 **Cyberpunk Theme** | Deep purple palette, neon accents, grid background, glassmorphism, and glow effects |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 |
| **Build** | Vite 6 |
| **UI Library** | Mantine v7 (Core, Dates, Hooks, Notifications) |
| **State** | Zustand 5 with `persist` middleware |
| **Charts** | Recharts 2 |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |
| **Animations** | Framer Motion 12 + CSS keyframes |
| **Icons** | Tabler Icons |
| **Dates** | Day.js |

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/Day-Planner.git
cd Day-Planner

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Build for Production

```bash
npm run build
npm run preview   # Preview the production build
```

The production bundle is output to the `dist/` folder, ready for deployment to Vercel, Netlify, or any static hosting.

---

## 🗂️ Project Structure

```
Day-Planner/
├── public/                  # Static assets
├── src/
│   ├── components/
│   │   ├── layout/          # AppShell, Sidebar, Topbar, StatusBar
│   │   ├── tasks/           # TaskModal
│   │   └── PrintModal.jsx   # Print schedule modal
│   ├── lib/
│   │   ├── store.js         # Zustand stores (Task, Subject, Chapter, UI)
│   │   └── dates.js         # Date utilities (dayjs wrappers)
│   ├── pages/
│   │   ├── WeeklyPlanner.jsx  # Main weekly grid with drag-and-drop
│   │   ├── Dashboard.jsx      # Overview stats and charts
│   │   ├── Analytics.jsx      # Detailed study analytics
│   │   ├── Subjects.jsx       # Subject & chapter management
│   │   └── Backlogs.jsx       # Overdue task tracker
│   ├── styles/
│   │   ├── global.css         # Design tokens, base styles, animations
│   │   ├── dashboard.css      # Command center layout
│   │   └── weekly-grid.css    # Grid styles and DnD feedback
│   ├── App.jsx              # Root component, header, drawer system
│   ├── main.jsx             # Entry point
│   └── theme.js             # Mantine theme configuration
├── index.html
├── package.json
└── vite.config.js
```

---

## 📋 Usage Guide

### Creating Tasks
Click any empty time slot in the weekly grid, or use the **ADD** button. Fill in the task name, select a subject, set the time, and hit **Create**.

### Drag & Drop
Grab any task block and drag it to a different time slot or day. The task's duration is preserved automatically.

### Subjects & Chapters
Open the **Subjects** drawer from the left toolbar. Add subjects with custom colors, then add chapters within each subject. Track chapter progress from *Not Started* through *Theory*, *Practice*, *Revised*, to *Mastered*.

### Analytics
Open the **Analytics** drawer to view:
- Daily study hours (last 7 days)
- Weekly trend (last 4 weeks)
- Hours by subject
- Category breakdown (lecture, practice, revision, etc.)
- Study streak counter

### Printing
Click the printer icon in the header. Select a specific day or "Full Week", preview the table, and hit **Print** to open the browser's print dialog.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Double-click task | Toggle done/pending |
| Click empty slot | Create new task |
| Click task | Edit task |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ and ⚡ by a focused student, for focused students.**

</div>
