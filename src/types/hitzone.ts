import { Monster } from 'monster';
import KinsectExtract from 'kinsectExtract';

export interface Hitzone {
  monster: Monster,
  part: string,
  extract?: KinsectExtract,

  sever: number,
  blunt: number,
  shot: number,

  fire: number,
  water: number,
  thunder: number,
  ice: number,
  dragon: number,

  stun: number
}
