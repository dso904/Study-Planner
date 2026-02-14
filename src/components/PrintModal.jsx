import { Modal, Box, Text, Group, Button, Stack, Select, Badge, Table } from '@mantine/core';
import { IconPrinter, IconCalendar } from '@tabler/icons-react';
import { useState, useMemo, useRef } from 'react';
import { useTaskStore, useSubjectStore, useUIStore } from '../lib/store';
import { getWeekDays, dayjs } from '../lib/dates';

export default function PrintModal({ opened, onClose }) {
    const { currentWeekStart } = useUIStore();
    const tasks = useTaskStore((s) => s.tasks);
    const subjects = useSubjectStore((s) => s.subjects);
    const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);
    const printRef = useRef(null);

    const dayOptions = [
        { value: '__all__', label: 'All Days (Full Week)' },
        ...weekDays.map((d) => ({
            value: d.date,
            label: `${d.dayName} — ${dayjs(d.date).format('MMM D, YYYY')}`,
        })),
    ];

    const [selectedDay, setSelectedDay] = useState('__all__');

    const dates = useMemo(() => {
        return selectedDay === '__all__' ? weekDays.map((d) => d.date) : [selectedDay];
    }, [selectedDay, weekDays]);

    const tasksByDate = useMemo(() => {
        const map = {};
        dates.forEach((date) => {
            map[date] = tasks
                .filter((t) => t.date === date)
                .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
        });
        return map;
    }, [tasks, dates]);

    const totalTasks = useMemo(() => dates.reduce((acc, d) => acc + (tasksByDate[d]?.length || 0), 0), [dates, tasksByDate]);

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;
        const win = window.open('', '_blank');
        win.document.write(`<!DOCTYPE html><html><head><title>Study Plan — ${selectedDay === '__all__' ? 'Week' : dayjs(selectedDay).format('ddd, MMM D')}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; padding: 32px; color: #1a1a2e; background: #fff; }
  h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
  .meta { font-size: 12px; color: #666; font-family: 'JetBrains Mono', monospace; margin-bottom: 24px; }
  h2 { font-size: 15px; font-weight: 700; margin-top: 24px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #e0e0e0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
  th { text-align: left; padding: 8px 10px; background: #f5f5f5; border-bottom: 2px solid #ccc; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'JetBrains Mono', monospace; }
  td { padding: 8px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .time { font-family: 'JetBrains Mono', monospace; font-size: 12px; white-space: nowrap; }
  .status-done { color: #22c55e; font-weight: 600; }
  .status-pending { color: #888; }
  .status-missed { color: #ef4444; font-weight: 600; }
  .notes { font-size: 11px; color: #888; font-style: italic; margin-top: 2px; }
  .empty { color: #aaa; font-style: italic; padding: 12px 0; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 10px; color: #999; font-family: 'JetBrains Mono', monospace; }
  @media print { body { padding: 16px; } }
</style></head><body>`);
        win.document.write(content.innerHTML);
        win.document.write(`<div class="footer">Day Planner · Generated ${dayjs().format('MMM D, YYYY [at] HH:mm')}</div>`);
        win.document.write('</body></html>');
        win.document.close();
        setTimeout(() => win.print(), 300);
    };

    const getStatusClass = (s) => s === 'done' ? 'status-done' : s === 'missed' ? 'status-missed' : 'status-pending';
    const getStatusLabel = (s) => s === 'done' ? '✓ Done' : s === 'in_progress' ? '◑ In Progress' : s === 'skipped' ? '→ Skipped' : s === 'missed' ? '✗ Missed' : '○ Pending';

    return (
        <Modal opened={opened} onClose={onClose} size="lg" padding="lg"
            title={<Group gap={8}><IconPrinter size={16} color="var(--neon-violet)" /><Text size="md" fw={700} c="var(--text-primary)">Print Schedule</Text></Group>}
        >
            <Stack gap="md">
                <Select
                    label="Select Day"
                    data={dayOptions}
                    value={selectedDay}
                    onChange={(v) => setSelectedDay(v || '__all__')}
                    size="sm"
                    leftSection={<IconCalendar size={14} />}
                    styles={{ label: { color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' } }}
                />

                {/* Rendered Preview */}
                <Box style={{ padding: 16, borderRadius: 10, background: '#fff', color: '#1a1a2e', maxHeight: 400, overflow: 'auto', border: '1px solid var(--border-subtle)' }}>
                    <div ref={printRef}>
                        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2, color: '#111' }}>Study Plan</h1>
                        <div style={{ fontSize: 11, color: '#666', fontFamily: 'JetBrains Mono, monospace', marginBottom: 18 }}>
                            {selectedDay === '__all__'
                                ? `Week of ${dayjs(currentWeekStart).format('MMMM D, YYYY')}`
                                : dayjs(selectedDay).format('dddd, MMMM D, YYYY')
                            } · {totalTasks} tasks
                        </div>

                        {dates.map((date) => {
                            const dayTasks = tasksByDate[date] || [];
                            return (
                                <div key={date}>
                                    <h2 style={{ fontSize: 14, fontWeight: 700, marginTop: 16, marginBottom: 6, paddingBottom: 3, borderBottom: '2px solid #e0e0e0', color: '#222' }}>
                                        {dayjs(date).format('dddd, MMMM D')}
                                    </h2>
                                    {dayTasks.length === 0 ? (
                                        <p style={{ color: '#aaa', fontStyle: 'italic', padding: '8px 0', fontSize: 12 }}>No tasks scheduled</p>
                                    ) : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 8 }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ textAlign: 'left', padding: '6px 8px', background: '#f5f5f5', borderBottom: '2px solid #ccc', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'JetBrains Mono, monospace', width: 90 }}>Time</th>
                                                    <th style={{ textAlign: 'left', padding: '6px 8px', background: '#f5f5f5', borderBottom: '2px solid #ccc', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'JetBrains Mono, monospace', width: 90 }}>Subject</th>
                                                    <th style={{ textAlign: 'left', padding: '6px 8px', background: '#f5f5f5', borderBottom: '2px solid #ccc', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'JetBrains Mono, monospace' }}>Task</th>
                                                    <th style={{ textAlign: 'left', padding: '6px 8px', background: '#f5f5f5', borderBottom: '2px solid #ccc', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'JetBrains Mono, monospace', width: 80 }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dayTasks.map((task) => {
                                                    const subject = subjects.find((s) => s.id === task.subject_id);
                                                    return (
                                                        <tr key={task.id}>
                                                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, whiteSpace: 'nowrap' }}>
                                                                {task.start_time || '--'}–{task.end_time || '--'}
                                                            </td>
                                                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee', fontSize: 12 }}>
                                                                {subject?.name || '—'}
                                                            </td>
                                                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>
                                                                <span style={{ fontWeight: 500 }}>{task.title}</span>
                                                                {task.category && <span style={{ color: '#888', fontSize: 10, marginLeft: 6 }}>[{task.category}]</span>}
                                                                {task.notes && <div style={{ fontSize: 10, color: '#888', fontStyle: 'italic', marginTop: 2 }}>{task.notes}</div>}
                                                            </td>
                                                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee', fontSize: 11, fontWeight: task.status === 'done' ? 600 : 400, color: task.status === 'done' ? '#22c55e' : task.status === 'missed' ? '#ef4444' : '#888' }}>
                                                                {getStatusLabel(task.status)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Box>

                {/* Actions */}
                <Group justify="flex-end" gap={8}>
                    <Button variant="subtle" color="gray" onClick={onClose} size="sm">Cancel</Button>
                    <Button color="violet" size="sm" leftSection={<IconPrinter size={14} />} onClick={handlePrint}
                        styles={{ root: { background: 'var(--gradient-primary)', border: 'none', fontWeight: 700 } }}
                    >
                        Print
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
