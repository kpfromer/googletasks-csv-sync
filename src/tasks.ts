import fs from 'fs';
import readline from 'readline';
import { tasks_v1 } from 'googleapis';
import { TaskList } from './types';

const getArray = <T>(value: T[] | undefined): T[] => (!!value ? value : []);

export const readFile = (file: string): Promise<Buffer> =>
  new Promise((resolve, reject) =>
    fs.readFile(file, (error, content) => (!!error ? reject(error) : resolve(content)))
  );
export const writeFile = (file: string, data: string): Promise<void> =>
  new Promise((resolve, reject) =>
    fs.writeFile(file, data, (error) => {
      if (error) return reject(error);
      resolve();
    })
  );

export const question = (ask: string): Promise<string> =>
  new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(ask, (code) => {
      rl.close();
      resolve(code);
    });
  });

export const createTaskList = async (
  service: tasks_v1.Tasks,
  name: string
): Promise<TaskList> => {
  const list = (
    await service.tasklists.insert({
      requestBody: { title: name }
    })
  ).data;
  return list;
};

export const getTaskLists = async (
  service: tasks_v1.Tasks
): Promise<tasks_v1.Schema$TaskList[]> => {
  const { items } = (await service.tasklists.list({ maxResults: 100 })).data;
  return items === undefined ? [] : items;
};

export const getTasks = async (
  service: tasks_v1.Tasks,
  tasklistId: string
): Promise<tasks_v1.Schema$Task[]> => {
  let { items, nextPageToken } = (
    await service.tasks.list({
      maxResults: 100,
      showCompleted: true,
      showHidden: true,
      tasklist: tasklistId
    })
  ).data;
  while (!!nextPageToken) {
    const { data } = await service.tasks.list({
      maxResults: 100,
      showCompleted: true,
      showHidden: true,
      tasklist: tasklistId
    });
    items = [...getArray(items), ...getArray(data.items)];
    nextPageToken = data.nextPageToken;
  }
  return getArray(items);
};
