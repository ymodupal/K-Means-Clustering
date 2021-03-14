/* Copyright 2016 Google Inc. All Rights Reserved.
Modifications Copyright 2020 Long Nguyen.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/

import * as dataset from './dataset';
import * as seedrandom from 'seedrandom';

/** A map between dataset names and functions generating classification data. */
export const datasets: { [key: string]: dataset.DataGenerator } = {
  circle: dataset.classifyCircleData,
  xor: dataset.classifyXORData,
  gauss: dataset.classifyTwoGaussData,
  spiral: dataset.classifySpiralData,
  moon: dataset.classifyMoonData
};

/** A map between dataset names and functions that generate regression data. */
export const regDatasets: { [key: string]: dataset.DataGenerator } = {
  'reg-plane': dataset.regressPlane,
  'reg-gauss': dataset.regressGaussian
};

export function getKeyFromValue(obj: any, value: any): any {
    for (const key in obj) if (obj[key] === value) return key;

    return undefined;
}

/**
 * The data type of a state variable. Used for determining the
 * (de)serialization method.
 */
export enum Type {
  STRING,
  NUMBER,
  ARRAY_NUMBER,
  ARRAY_STRING,
  BOOLEAN,
  OBJECT
}

export enum Problem {
  CLASSIFICATION,
  REGRESSION
}

export const problems = {
  classification: Problem.CLASSIFICATION,
  regression: Problem.REGRESSION
};

export interface Property {
  name: string;
  type: Type;
  keyMap?: { [key: string]: any };
}

// Add the GUI state.
export class State {
  private static PROPS: Property[] = [
    { name: 'dataset', type: Type.OBJECT, keyMap: datasets },
    { name: 'regDataset', type: Type.OBJECT, keyMap: regDatasets },
    { name: 'noise', type: Type.NUMBER },
    { name: 'seed', type: Type.STRING },
    { name: 'showTestData', type: Type.BOOLEAN },
    { name: 'discretize', type: Type.BOOLEAN },
    { name: 'percTrainData', type: Type.NUMBER },
    { name: 'problem', type: Type.OBJECT, keyMap: problems },
    { name: 'percSamples', type: Type.NUMBER },
    { name: 'clusters', type: Type.NUMBER}
  ];

  [key: string]: any;
  showTestData = false;
  noise = 0;
  discretize = false;
  percTrainData = 70;
  problem = Problem.CLASSIFICATION;
  dataset: dataset.DataGenerator = dataset.classifyCircleData;
  regDataset: dataset.DataGenerator = dataset.regressPlane;
  seed: string | undefined;
  percSamples = 80;
  clusters = 2;

  /**
   * Deserializes the state from the url hash.
   */
  static deserializeState(): State {
    const map: { [key: string]: string } = {};
    for (const keyvalue of window.location.hash.slice(1).split('&')) {
      const [name, value] = keyvalue.split('=');
      map[name] = value;
    }
    const state = new State();

    function hasKey(name: string): boolean {
      return name in map && map[name] != null && map[name].trim() !== '';
    }

    function parseArray(value: string): string[] {
      return value.trim() === '' ? [] : value.split(',');
    }

    // Deserialize regular properties.
    State.PROPS.forEach(({ name, type, keyMap }) => {
      switch (type) {
        case Type.OBJECT:
          if (keyMap == null) {
            throw Error(
              // eslint-disable-next-line max-len
              'A key-value map must be provided for state variables of type Object'
            );
          }
          if (hasKey(name) && map[name] in keyMap) {
            state[name] = keyMap[map[name]];
          }
          break;

        case Type.NUMBER:
          if (hasKey(name)) {
            // "+" operator is for converting a string to a number.
            state[name] = +map[name];
          }
          break;

        case Type.STRING:
          if (hasKey(name)) {
            state[name] = map[name];
          }
          break;

        case Type.BOOLEAN:
          if (hasKey(name)) {
            state[name] = map[name] !== 'false';
          }
          break;

        case Type.ARRAY_NUMBER:
          if (name in map) {
            state[name] = parseArray(map[name]).map(Number);
          }
          break;

        case Type.ARRAY_STRING:
          if (name in map) {
            state[name] = parseArray(map[name]);
          }
          break;

        default:
          throw Error('Encountered an unknown type for a state variable');
      }
    });

    // Deserialize state properties that correspond to hiding UI controls.
    if (state.seed == null) {
      state.seed = Math.random().toFixed(5);
    }
    seedrandom(state.seed);

    return state;
  }

  /**
   * Serializes the state into the url hash.
   */
  serialize() {
    // Serialize regular properties.
    const props: string[] = [];
    State.PROPS.forEach(({ name, type, keyMap }) => {
      let value = this[name];
      // Don't serialize missing values.
      if (value == null) {
        return;
      }
      if (type === Type.OBJECT) {
        value = getKeyFromValue(keyMap, value);
      } else if (type === Type.ARRAY_NUMBER || type === Type.ARRAY_STRING) {
        value = value.join(',');
      }
      props.push(`${name}=${value}`);
    });
    window.location.hash = props.join('&');
  }
}
