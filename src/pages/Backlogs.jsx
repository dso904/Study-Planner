import { Box, Text, Group, Button, Stack, Badge, ActionIcon, Checkbox } from '@mantine/core';
import { IconAlertTriangle, IconTrash, IconArrowRight, IconCheck } from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import { useTaskStore, useSubjectStore } from '../lib/store';
import { dayjs } from '../lib/dates';

const priorityColors = { critical: '#f43f5e', high: '#fb923c', medium: '#facc15', low: '#34d399' };

export default function Backlogs() {
    const tasks = useTaskStore((s) => s.tasks);
    const subjects = useSubjectStore((s) => s.subjects);
    const { updateTask, deleteTask } = useTaskStore();
    const [selected, setSelected] = useState(new Set());

    const backlogs = useMemo(() => {
        return tasks
            .filter((t) => t.status !== 'done' && t.status !== 'skipped' && dayjs(t.date).isBefore(dayjs(), 'day'))
            .sort((a, b) => {
                const pOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                const pDiff = (pOrder[a.priority] || 3) - (pOrder[b.priority] || 3);
                return pDiff !== 0 ? pDiff : a.date.localeCompare(b.date);
            });
    }, [tasks]);

    const toggleSelect = (id) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const selectAll = () => setSelected(selected.size === backlogs.length ? new Set() : new Set(backlogs.map((t) => t.id)));
    const markSelectedDone = () => { selected.forEach((id) => updateTask(id, { status: 'done' })); setSelected(new Set()); };
    const dismissSelected = () => { selected.forEach((id) => updateTask(id, { status: 'skipped' })); setSelected(new Set()); };
    const rescheduleToday = (id) => updateTask(id, { date: dayjs().format('YYYY-MM-DD') });
    const daysOverdue = (date) => dayjs().diff(dayjs(date), 'day');

    if (backlogs.length === 0) {
        return (
            <Box style={{ textAlign: 'center', padding: '32px 16px' }}>
                <IconCheck size={32} color="var(--neon-green)" style={{ marginBottom: 8 }} />
                <Text size="sm" fw={600} c="var(--neon-green)" className="mono">ALL CLEAR</Text>
                <Text size="xs" c="var(--text-faint)" mt={4}>No overdue tasks. Keep it up! 🎯</Text>
            </Box>
        );
    }

    return (
        <>
            {/* Toolbar */}
            <Group justify="space-between" mb="sm">
                <Group gap={8}>
                    <Checkbox size="xs" checked={selected.size === backlogs.length} indeterminate={selected.size > 0 && selected.size < backlogs.length} onChange={selectAll}
                        label={<Text size="xs" c="var(--text-muted)">Select all ({backlogs.length})</Text>}
                        styles={{ input: { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-glow)' } }}
                    />
                </Group>
                {selected.size > 0 && (
                    <Group gap={6}>
                        <Text size="10px" c="var(--text-faint)" className="mono">{selected.size} selected</Text>
                        <Button size="xs" variant="light" color="green" onClick={markSelectedDone} styles={{ root: { fontWeight: 600, fontSize: 10, height: 26 } }}>Mark Done</Button>
                        <Button size="xs" variant="subtle" color="gray" onClick={dismissSelected} styles={{ root: { fontWeight: 600, fontSize: 10, height: 26 } }}>Dismiss</Button>
                    </Group>
                )}
            </Group>

            {/* Backlog Cards — full-width grid */}
            <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                {backlogs.map((task) => {
                    const overdue = daysOverdue(task.date);
                    const subject = subjects.find((s) => s.id === task.subject_id);
                    const pColor = priorityColors[task.priority] || '#8b5cf6';
                    return (
                        <Box key={task.id} style={{
                            padding: '12px 14px',
                            borderRadius: 10,
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            borderLeft: `3px solid ${pColor}`,
                            transition: 'all 150ms ease',
                        }}>
                            <Group gap={8} wrap="nowrap" mb={6}>
                                <Checkbox size="xs" checked={selected.has(task.id)} onChange={() => toggleSelect(task.id)}
                                    styles={{ input: { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-glow)' } }}
                                />
                                <Box style={{ flex: 1, minWidth: 0 }}>
                                    <Text size="sm" fw={600} c="var(--text-primary)" lineClamp={1}>{task.title}</Text>
                                </Box>
                            </Group>

                            <Group gap={6} mb={8}>
                                <Badge size="xs" variant="dot" color="red"
                                    styles={{ root: { color: 'var(--text-muted)', fontSize: 9, fontFamily: 'var(--font-mono)' } }}
                                >
                                    {overdue}d overdue
                                </Badge>
                                {subject && (
                                    <Badge size="xs" variant="outline"
                                        styles={{ root: { borderColor: `${subject.color || '#8b5cf6'}30`, color: subject.color || '#8b5cf6', fontSize: 9, fontFamily: 'var(--font-mono)' } }}
                                    >
                                        {subject.name}
                                    </Badge>
                                )}
                                <Badge size="xs" variant="light" color={task.priority === 'critical' ? 'red' : task.priority === 'high' ? 'orange' : 'gray'}
                                    styles={{ root: { fontSize: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' } }}
                                >
                                    {task.priority}
                                </Badge>
                            </Group>

                            <Text size="10px" c="var(--text-faint)" className="mono" mb={8}>
                                {dayjs(task.date).format('ddd, MMM D')} · {task.start_time}–{task.end_time} · {task.category}
                            </Text>

                            <Group gap={6}>
                                <Button variant="light" color="cyan" size="xs" leftSection={<IconArrowRight size={12} />} onClick={() => rescheduleToday(task.id)}
                                    styles={{ root: { height: 24, fontSize: 10, fontWeight: 600 } }}
                                >
                                    Today
                                </Button>
                                <Button variant="light" color="green" size="xs" leftSection={<IconCheck size={12} />} onClick={() => updateTask(task.id, { status: 'done' })}
                                    styles={{ root: { height: 24, fontSize: 10, fontWeight: 600 } }}
                                >
                                    Done
                                </Button>
                                <ActionIcon variant="subtle" size="sm" onClick={() => deleteTask(task.id)} style={{ marginLeft: 'auto' }}>
                                    <IconTrash size={13} color="var(--neon-pink)" />
                                </ActionIcon>
                            </Group>
                        </Box>
                    );
                })}
            </Box>
        </>
    );
}
