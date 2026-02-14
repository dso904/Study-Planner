import { Box, Text, Group, Button, Stack, TextInput, ActionIcon, Badge, Select, Progress, Modal, ColorInput } from '@mantine/core';
import { IconPlus, IconTrash, IconChevronRight, IconChevronDown, IconClock, IconAlertTriangle } from '@tabler/icons-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { useSubjectStore, useChapterStore, useTaskStore } from '../lib/store';
import { dayjs } from '../lib/dates';

const chapterStatuses = [
    { value: 'not_started', label: 'Not Started', color: 'gray' },
    { value: 'theory', label: 'Theory', color: 'blue' },
    { value: 'practice', label: 'Practice', color: 'yellow' },
    { value: 'revised', label: 'Revised', color: 'orange' },
    { value: 'mastered', label: 'Mastered', color: 'green' },
];
const statusProgress = { not_started: 0, theory: 25, practice: 50, revised: 75, mastered: 100 };
const defaultColors = ['#22d3ee', '#f472b6', '#fb923c', '#34d399', '#8b5cf6', '#a855f7', '#f43f5e', '#facc15'];

function AddSubjectModal({ opened, onClose }) {
    const { addSubject } = useSubjectStore();
    const [name, setName] = useState('');
    const [color, setColor] = useState('#8b5cf6');
    const handleSave = () => {
        if (!name.trim()) return;
        addSubject({ id: crypto.randomUUID(), name, color, sort_order: 0, created_at: new Date().toISOString() });
        onClose(); setName(''); setColor('#8b5cf6');
    };
    return (
        <Modal opened={opened} onClose={onClose} title={<Text fw={700} c="var(--text-primary)">Add Subject</Text>} size="sm">
            <Stack gap="sm">
                <TextInput label="Name" placeholder="e.g., Physics" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                <ColorInput label="Color" value={color} onChange={setColor} swatches={defaultColors} format="hex" />
                <Group justify="flex-end" mt="xs">
                    <Button variant="subtle" color="gray" onClick={onClose} size="xs">Cancel</Button>
                    <Button color="violet" onClick={handleSave} disabled={!name.trim()} size="xs">Add</Button>
                </Group>
            </Stack>
        </Modal>
    );
}

function AddChapterModal({ opened, onClose, subjectId }) {
    const { addChapter } = useChapterStore();
    const [name, setName] = useState('');
    const handleSave = () => {
        if (!name.trim()) return;
        addChapter({ id: crypto.randomUUID(), subject_id: subjectId, name, status: 'not_started', sort_order: 0, notes: '', created_at: new Date().toISOString() });
        onClose(); setName('');
    };
    return (
        <Modal opened={opened} onClose={onClose} title={<Text fw={700} c="var(--text-primary)">Add Chapter</Text>} size="sm">
            <Stack gap="sm">
                <TextInput label="Chapter Name" placeholder="e.g., Kinematics" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                <Group justify="flex-end"><Button variant="subtle" color="gray" onClick={onClose} size="xs">Cancel</Button><Button color="violet" onClick={handleSave} disabled={!name.trim()} size="xs">Add</Button></Group>
            </Stack>
        </Modal>
    );
}

function SubjectItem({ subject, index }) {
    const chapters = useChapterStore((s) => s.chapters.filter((c) => c.subject_id === subject.id));
    const tasks = useTaskStore((s) => s.tasks);
    const { deleteSubject } = useSubjectStore();
    const { updateChapter, deleteChapter } = useChapterStore();
    const [expanded, setExpanded] = useState(false);
    const [addModalOpen, setAddModalOpen] = useState(false);

    const overallProgress = chapters.length > 0 ? Math.round(chapters.reduce((acc, c) => acc + (statusProgress[c.status] || 0), 0) / chapters.length) : 0;

    // Subject-level stats
    const stats = useMemo(() => {
        const subjectTasks = tasks.filter((t) => t.subject_id === subject.id);
        const doneTasks = subjectTasks.filter((t) => t.status === 'done');
        const overdue = subjectTasks.filter((t) => t.status !== 'done' && t.status !== 'skipped' && dayjs(t.date).isBefore(dayjs(), 'day'));
        const hours = doneTasks.reduce((acc, t) => {
            if (t.start_time && t.end_time) return acc + dayjs(t.end_time, 'HH:mm').diff(dayjs(t.start_time, 'HH:mm'), 'minute') / 60;
            return acc;
        }, 0);
        return { total: subjectTasks.length, done: doneTasks.length, overdue: overdue.length, hours: Math.round(hours * 10) / 10 };
    }, [tasks, subject.id]);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
            >
                <Box style={{ borderRadius: 8, background: 'rgba(139, 92, 246, 0.03)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                    <Box onClick={() => setExpanded(!expanded)} style={{ padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Group gap={8}>
                            <Box style={{ width: 8, height: 8, borderRadius: 2, background: subject.color, boxShadow: `0 0 6px ${subject.color}40` }} />
                            <Box>
                                <Text size="xs" fw={600} c="var(--text-primary)" lh={1.2}>{subject.name}</Text>
                                <Group gap={6}>
                                    <Text size="9px" c="var(--text-faint)" className="mono">{chapters.length} ch · {overallProgress}%</Text>
                                    {stats.hours > 0 && (
                                        <Badge size="xs" variant="light" color="violet" radius="sm" styles={{ root: { fontFamily: 'var(--font-mono)', fontSize: 8, padding: '0 4px', height: 14 } }}>
                                            <Group gap={2}><IconClock size={8} />{stats.hours}h</Group>
                                        </Badge>
                                    )}
                                    {stats.overdue > 0 && (
                                        <Badge size="xs" variant="light" color="red" radius="sm" styles={{ root: { fontFamily: 'var(--font-mono)', fontSize: 8, padding: '0 4px', height: 14 } }}>
                                            <Group gap={2}><IconAlertTriangle size={8} />{stats.overdue}</Group>
                                        </Badge>
                                    )}
                                </Group>
                            </Box>
                        </Group>
                        {expanded ? <IconChevronDown size={12} color="var(--text-faint)" /> : <IconChevronRight size={12} color="var(--text-faint)" />}
                    </Box>

                    <Progress value={overallProgress} size={2} color={subject.color} styles={{ root: { background: 'rgba(139,92,246,0.05)' } }} />

                    <AnimatePresence>
                        {expanded && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                                <Box style={{ padding: '8px 10px', borderTop: '1px solid var(--border-subtle)' }}>
                                    {/* Stats row */}
                                    <Group gap={8} mb={6}>
                                        <Text size="9px" c="var(--text-faint)" className="mono">{stats.done}/{stats.total} tasks</Text>
                                        {stats.hours > 0 && <Text size="9px" c="var(--text-faint)" className="mono">· {stats.hours}h studied</Text>}
                                    </Group>
                                    <Group gap={4} mb={6}>
                                        <Button variant="subtle" color="violet" size="xs" leftSection={<IconPlus size={12} />} onClick={() => setAddModalOpen(true)} styles={{ root: { height: 22, fontSize: 10 } }}>Chapter</Button>
                                        <ActionIcon variant="subtle" size="xs" onClick={() => deleteSubject(subject.id)}><IconTrash size={12} color="var(--neon-pink)" /></ActionIcon>
                                    </Group>
                                    {chapters.length === 0 ? (
                                        <Text size="xs" c="var(--text-faint)" ta="center" py={4}>No chapters yet</Text>
                                    ) : (
                                        <Stack gap={3}>
                                            {chapters.map((ch) => (
                                                <Group key={ch.id} justify="space-between" style={{ padding: '4px 6px', borderRadius: 4, background: 'rgba(10, 8, 32, 0.3)' }}>
                                                    <Group gap={6} style={{ flex: 1 }}>
                                                        <Box style={{ width: 4, height: 4, borderRadius: '50%', background: ch.status === 'mastered' ? '#22c55e' : ch.status === 'not_started' ? '#64748b' : subject.color }} />
                                                        <Text size="xs" c="var(--text-secondary)" lineClamp={1} style={{ flex: 1 }}>{ch.name}</Text>
                                                    </Group>
                                                    <Group gap={4}>
                                                        <Select size="xs" variant="unstyled" value={ch.status}
                                                            data={chapterStatuses.map((s) => ({ value: s.value, label: s.label }))}
                                                            onChange={(v) => updateChapter(ch.id, { status: v })}
                                                            style={{ width: 90 }}
                                                            styles={{ input: { fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minHeight: 20, paddingTop: 0, paddingBottom: 0 } }}
                                                        />
                                                        <ActionIcon variant="subtle" size="xs" onClick={() => deleteChapter(ch.id)}><IconTrash size={10} color="var(--text-faint)" /></ActionIcon>
                                                    </Group>
                                                </Group>
                                            ))}
                                        </Stack>
                                    )}
                                </Box>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Box>
            </motion.div>
            <AddChapterModal opened={addModalOpen} onClose={() => setAddModalOpen(false)} subjectId={subject.id} />
        </>
    );
}

export default function Subjects() {
    const subjects = useSubjectStore((s) => s.subjects);
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <>
            <Group justify="space-between" mb={8}>
                <Text size="9px" c="var(--text-faint)" className="mono">{subjects.length} SUBJECTS</Text>
                <Button variant="subtle" color="violet" size="xs" leftSection={<IconPlus size={12} />} onClick={() => setModalOpen(true)} styles={{ root: { height: 22, fontSize: 10 } }}>
                    Add
                </Button>
            </Group>

            {subjects.length === 0 ? (
                <Box style={{ textAlign: 'center', padding: '16px 0' }}>
                    <Text size="xs" c="var(--text-faint)">No subjects. Click + to add.</Text>
                </Box>
            ) : (
                <Stack gap={6}>
                    {subjects.map((s, i) => <SubjectItem key={s.id} subject={s} index={i} />)}
                </Stack>
            )}

            <AddSubjectModal opened={modalOpen} onClose={() => setModalOpen(false)} />
        </>
    );
}
