import type { Workout } from '../types';
import { Btn, Modal } from './ui';

export default function WorkoutModal({ workout, done, onToggle, onClose }: { workout: Workout; done: boolean; onToggle: () => void; onClose: () => void }) {
  return (
    <Modal title={workout.name} onClose={onClose} wide>
      <p className="text-sm">{workout.category} · {workout.difficulty} · {workout.durationMinutes ? `${workout.durationMinutes} minutes` : 'no session planned'} · equipment: {workout.equipment.join(', ')}</p>
      {workout.exercises.length === 0 && <p className="mt-3 text-sm">Take today to recover. Rest is part of a balanced week.</p>}
      <ul className="mt-3 space-y-3">
        {workout.exercises.map((e) => (
          <li key={e.name} className="rounded-md bg-paper p-3 text-sm">
            <p className="font-semibold">{e.name}</p>
            <p>{[e.sets && `${e.sets} sets`, e.repetitions && `${e.repetitions} reps`, e.durationSeconds && `${e.durationSeconds >= 120 ? Math.round(e.durationSeconds / 60) + ' min' : e.durationSeconds + ' sec'}`, e.restSeconds ? `rest ${e.restSeconds} sec` : ''].filter(Boolean).join(' · ')}</p>
            <p className="mt-1">{e.instructions}</p>
            {e.modification && <p className="mt-1 text-spruce-dark">Easier option: {e.modification}</p>}
          </li>
        ))}
      </ul>
      <h3 className="mt-4 font-semibold">Safety notes</h3>
      <ul className="mt-1 list-disc pl-5 text-sm">{workout.safetyNotes.map((s) => <li key={s}>{s}</li>)}</ul>
      <div className="mt-4"><Btn kind="primary" onClick={onToggle}>{done ? 'Unmark Complete' : 'Complete'}</Btn></div>
    </Modal>
  );
}
