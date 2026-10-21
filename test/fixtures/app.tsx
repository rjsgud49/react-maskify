import InputMask from 'react-input-mask';
import type { Props } from "react-input-mask";
const Lazy = import('react-input-mask');
const Req = require('react-input-mask');
jest.mock('react-input-mask');
// mention of react-input-mask in a comment stays
const other = 'react-input-mask-extra';
export { InputMask, Lazy, Req, other };
export type { Props };
