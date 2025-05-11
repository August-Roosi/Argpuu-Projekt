
import { AppNode } from './types';

export const initialNodes: AppNode[] = [
  { id: 'a', type: 'text-updater', position: { x: 0, y: 0 }, data: { label: 'Egoism kehtib' } },
  {
    id: 'b',
    type: 'argument',
    position: { x: -100, y: 100 },
    data: { label: 'drag me!' },
  }, 
  { id: 'c', type: "argument", position: { x: 100, y: 100 }, data: { label: 'Me ei tee midagi ainult siis kui endal on selleks rohkem motivaatoreid kui mittemotivaatoreid' } },
  {
    id: 'd',
    type: 'argument',
    position: { x: 0, y: 200 },
    data: { label: 'with React Flow' },
  },
];


