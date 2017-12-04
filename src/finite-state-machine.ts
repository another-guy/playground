// tslint:disable:no-console

export interface StateMachineDefinition<State extends string, Signal extends string> {
  states: State[];
  initialState: State;
  finalStates: State[];
  transitions: { [state in State]?: { [signal in Signal]?: State; } };
}

export interface StateMachineRuntime<State extends string, Signal extends string> {
  currentState: State;
  process(signal: Signal): void;
  isInFinalState(): boolean;
}

export type Stream<Signal> = Signal[];

export class StateMachine<State extends string, Signal extends string>
  implements
    StateMachineDefinition<State, Signal>,
    StateMachineRuntime<State, Signal> {

  states: State[] = [];
  initialState: State;
  finalStates: State[] = [];
  transitions: { [state in State]?: { [signal in Signal]?: State; } };

  currentState: State;

  constructor(stateMachineDefinition: StateMachineDefinition<State, Signal>) {
    this.states = stateMachineDefinition.states;
    this.initialState = stateMachineDefinition.initialState;
    this.finalStates = stateMachineDefinition.finalStates;
    this.transitions = stateMachineDefinition.transitions;

    this.currentState = stateMachineDefinition.initialState;

    console.info(`Initialized state machine.\n${ JSON.stringify(this, null, 2) }`);
  }

  process(signal: Signal): void {
    const currentStateAllowedTransitions: { [_ in Signal]?: State; } | undefined = this.transitions[this.currentState];
    if (currentStateAllowedTransitions == null) {
      throw new Error(`No transitions are allowed from '${this.currentState}'`);
    }

    const newState: State | undefined = currentStateAllowedTransitions[signal];
    if (newState == null) {
      throw new Error(`No transition is allowed from '${this.currentState}' for '${signal}'`);
    }

    this.currentState = newState;
  }

  isInFinalState(): boolean {
    return this.finalStates.some(knownFinalState => knownFinalState === this.currentState);
  }

}

// ----------------------------------------------------------------------------------------

type DeviceStates = 'off' | 'waiting' | 'sleeping';
type UserCommands = 'turnOn' | 'turnOff' | 'putToSleep' | 'awake';

const stateMachine = new StateMachine<DeviceStates, UserCommands>({
  states: ['off', 'waiting', 'sleeping'],
  initialState: 'off',
  finalStates: ['off'],
  transitions: {
    off: {
      turnOn: 'waiting',
    },
    waiting: {
      turnOff: 'off',
      putToSleep: 'sleeping',
    },
    sleeping: {
      awake: 'waiting',
    },
  },
});

console.warn(`====================================`);

const signals: Stream<UserCommands> = [ 'turnOn', 'putToSleep', 'awake', 'turnOff' ];

console.warn(`original state: '${ stateMachine.currentState }'`);
console.warn(`------------------------------------`);

signals.forEach(signal => {
  const state = stateMachine.currentState;

  stateMachine.process(signal);

  console.warn(`state '${ state }' + signal '${ signal }' => state '${ stateMachine.currentState }'`);
});

console.warn(`------------------------------------`);
console.warn(`result state: '${ stateMachine.currentState }'`);
