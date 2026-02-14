import { Modal, TextInput, Select, Textarea, Group, Button, Stack, Grid, Text, ActionIcon, Badge, Box } from '@mantine/core';
import { IconTrash, IconClock, IconCategory, IconFlag, IconBook2 } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useTaskStore, useSubjectStore } from '../../lib/store';
import { dayjs } from '../../lib/dates';

const categories = [
    { value: 'lecture', label: '📺 Lecture' },
    { value: 'theory', label: '📖 Theory' },
    { value: 'revision', label: '🔁 Revision' },
    { value: 'practice', label: '✏️ Practice' },
    { value: 'test', label: '📝 Test / Mock' },
    { value: 'assignment', label: '📋 Assignment' },
    { value: 'self_study', label: '🧠 Self-Study' },
    { value: 'school', label: '🏫 School' },
    { value: 'tuition', label: '🎓 Tuition' },
    { value: 'other', label: '⚡ Other' },
];

const priorities = [
    { value: 'critical', label: '🔴 Critical' },
    { value: 'high', label: '🟠 High' },
    { value: 'medium', label: '🟡 Medium' },
    { value: 'low', label: '🟢 Low' },
];

const statuses = [
    { value: 'pending', label: '⏳ Pending' },
    { value: 'in_progress', label: '🔄 In Progress' },
    { value: 'done', label: '✅ Done' },
    { value: 'skipped', label: '⏭️ Skipped' },
    { value: 'missed', label: '🔴 Missed' },
];

const labelStyle = { color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' };

const initialForm = {
    title: '', subject_id: null, subject_name: '', chapter_id: null,
    category: 'lecture', priority: 'medium', status: 'pending',
    date: '', start_time: '', end_time: '', notes: '',
};

export default function TaskModal({ opened, onClose, task, defaultDate, defaultTime }) {
    const subjects = useSubjectStore((s) => s.subjects);
    const { addTask, updateTask, deleteTask } = useTaskStore();
    const [form, setForm] = useState(initialForm);
    const isEditing = !!task;

    useEffect(() => {
        if (task) {
            setForm({
                title: task.title || '', subject_id: task.subject_id || null, subject_name: task.subject_name || '',
                chapter_id: task.chapter_id || null, category: task.category || 'lecture', priority: task.priority || 'medium',
                status: task.status || 'pending', date: task.date || '', start_time: task.start_time || '',
                end_time: task.end_time || '', notes: task.notes || '',
            });
        } else {
            setForm({
                ...initialForm,
                date: defaultDate || dayjs().format('YYYY-MM-DD'),
                start_time: defaultTime || '09:00',
                end_time: defaultTime ? dayjs(defaultTime, 'HH:mm').add(1, 'hour').format('HH:mm') : '10:00',
            });
        }
    }, [task, defaultDate, defaultTime, opened]);

    const updateField = (k, v) => setForm((p) => ({ ...p, [k]: v }));
    const handleSubjectChange = (id) => { const s = subjects.find((x) => x.id === id); setForm((p) => ({ ...p, subject_id: id, subject_name: s?.name || '' })); };

    const handleSave = () => {
        if (!form.title.trim()) return;
        if (isEditing) { updateTask(task.id, { ...form }); }
        else { addTask({ id: crypto.randomUUID(), ...form, is_backlog: false, original_date: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }); }
        onClose();
    };

    const handleDelete = () => { if (task) { deleteTask(task.id); onClose(); } };

    return (
        <Modal opened={opened} onClose={onClose} size="lg" padding="xl"
            title={
                <Group gap={8}>
                    <Text size="lg" fw={800} className="neon-text">{isEditing ? 'EDIT TASK' : 'NEW TASK'}</Text>
                    {isEditing && (
                        <Badge size="sm" variant="outline"
                            color={form.status === 'done' ? 'green' : form.status === 'missed' ? 'red' : form.status === 'in_progress' ? 'cyan' : 'gray'}
                            styles={{ root: { fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', borderColor: 'var(--border-glow)' } }}
                        >
                            {form.status.toUpperCase()}
                        </Badge>
                    )}
                </Group>
            }
        >
            <Stack gap="md">
                <TextInput label="Task" placeholder="e.g., Kinematics — HCV Ch.4" value={form.title} onChange={(e) => updateField('title', e.target.value)} required autoFocus size="md"
                    styles={{ label: labelStyle }}
                />

                {/* Date + Start Time + End Time */}
                <Grid>
                    <Grid.Col span={4}>
                        <TextInput label="Date" type="date" value={form.date} onChange={(e) => updateField('date', e.target.value)} leftSection={<IconClock size={14} />} size="sm" styles={{ label: labelStyle }} />
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <TextInput label="Start Time" type="time" value={form.start_time} onChange={(e) => updateField('start_time', e.target.value)} size="sm" styles={{ label: labelStyle }} />
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <TextInput label="End Time" type="time" value={form.end_time} onChange={(e) => updateField('end_time', e.target.value)} size="sm" styles={{ label: labelStyle }} />
                    </Grid.Col>
                </Grid>

                <Grid>
                    <Grid.Col span={6}><Select label="Subject" placeholder="Select" data={subjects.map((s) => ({ value: s.id, label: s.name }))} value={form.subject_id} onChange={handleSubjectChange} leftSection={<IconBook2 size={14} />} clearable searchable size="sm" nothingFoundMessage="Add subjects first" styles={{ label: labelStyle }} /></Grid.Col>
                    <Grid.Col span={6}><Select label="Category" data={categories} value={form.category} onChange={(v) => updateField('category', v)} leftSection={<IconCategory size={14} />} size="sm" styles={{ label: labelStyle }} /></Grid.Col>
                </Grid>
                <Grid>
                    <Grid.Col span={6}><Select label="Priority" data={priorities} value={form.priority} onChange={(v) => updateField('priority', v)} leftSection={<IconFlag size={14} />} size="sm" styles={{ label: labelStyle }} /></Grid.Col>
                    <Grid.Col span={6}><Select label="Status" data={statuses} value={form.status} onChange={(v) => updateField('status', v)} size="sm" styles={{ label: labelStyle }} /></Grid.Col>
                </Grid>
                <Textarea label="Notes" placeholder="Additional details..." value={form.notes} onChange={(e) => updateField('notes', e.target.value)} rows={2} size="sm" styles={{ label: labelStyle }} />
                <Group justify="space-between" mt="sm">
                    <Box>
                        {isEditing && (
                            <ActionIcon variant="light" color="red" size="lg" radius="md" onClick={handleDelete} title="Delete">
                                <IconTrash size={16} />
                            </ActionIcon>
                        )}
                    </Box>
                    <Group gap={8}>
                        <Button variant="subtle" color="gray" onClick={onClose} size="sm">Cancel</Button>
                        <Button color="violet" onClick={handleSave} disabled={!form.title.trim()} size="sm"
                            styles={{ root: { background: 'var(--gradient-primary)', border: 'none', fontWeight: 700, letterSpacing: '0.03em' } }}
                        >
                            {isEditing ? 'SAVE' : 'CREATE'}
                        </Button>
                    </Group>
                </Group>
            </Stack>
        </Modal>
    );
}
