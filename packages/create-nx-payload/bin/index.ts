#!/usr/bin/env node

import { type Arguments, commandsObject } from './create-nx-payload';

export { type Arguments };

void commandsObject.parse(process.argv);
