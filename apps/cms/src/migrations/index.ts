import * as migration_20241218_093558_cod_213 from './20241218_093558_cod_213';
import * as migration_20250114_154346_cod_219 from './20250114_154346_cod_219';
import * as migration_20250127_132240_cod_249 from './20250127_132240_cod_249';
import * as migration_20250128_150738_cod_255 from './20250128_150738_cod_255';
import * as migration_20250217_224156_payload3 from './20250217_224156_payload3';

export const migrations = [
  {
    up: migration_20241218_093558_cod_213.up,
    down: migration_20241218_093558_cod_213.down,
    name: '20241218_093558_cod_213'
  },
  {
    up: migration_20250114_154346_cod_219.up,
    down: migration_20250114_154346_cod_219.down,
    name: '20250114_154346_cod_219'
  },
  {
    up: migration_20250127_132240_cod_249.up,
    down: migration_20250127_132240_cod_249.down,
    name: '20250127_132240_cod_249'
  },
  {
    up: migration_20250128_150738_cod_255.up,
    down: migration_20250128_150738_cod_255.down,
    name: '20250128_150738_cod_255'
  },
  {
    up: migration_20250217_224156_payload3.up,
    down: migration_20250217_224156_payload3.down,
    name: '20250217_224156_payload3'
  }
];
