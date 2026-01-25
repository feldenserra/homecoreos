/*
    Copyright (C) 2026 feldenserra

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import FilterToggle from './components/FilterToggle';
import { CoreStack } from './components/CoreStack';
import { CoreItem } from './components/CoreItem';
import { CorePage } from './components/CorePage';
import * as taskRepo from './actions/tasks';
import NewTaskForm from './components/NewTaskForm';
import { TaskItem } from './components/TaskItem';
import { SetTabHeader } from './layout';

function HandleAddTask(Formadata: FormData) {
  taskRepo.create(
    Formadata.get('name') as string,
    Formadata.get('category') as string
  );
}

export default async function Dashboard(props: { searchParams: Promise<{ filter?: string }> }) {
  const searchParams = await props.searchParams;
  const filter = searchParams.filter || 'active';

  const showCompleted = filter === 'done';
  const data = await taskRepo.getAll(showCompleted);
  const visibleTasks = data.tasks.filter(x => x.done === showCompleted);
  SetTabHeader(showCompleted ? 'Archive' : 'My Tasks');

  return (
    <CoreStack row spacing={0} className="flex-1 overflow-hidden">

      {/* SIDEBAR */}
      <CoreItem fixed className="w-80 h-full overflow-y-auto bg-base-200">
        <ul className="menu p-4 min-h-full gap-4 text-base-content">

          {/* Menu Title */}
          <li className="menu-title">Actions</li>

          {/* Filter Toggle */}
          <li><FilterToggle /></li>

          {/* Add Task Form */}
          <NewTaskForm />

          <li className="menu-title mt-4">Stats</li>
          <div className="stats shadow">
            <div className="stat place-items-center">
              <div className="stat-value text-primary text-2xl">{data.total}</div>
              <div className="stat-desc">Lifetime Tasks</div>
            </div>
          </div>

        </ul>
      </CoreItem>

      {/* MAIN CONTENT*/}
      <CoreItem grow className="h-full overflow-y-auto bg-base-300">
        <div className="p-8 max-w-4xl mx-auto">

          <div className="flex justify-between items-end mb-6">
            <h2 className="text-3xl font-bold">{showCompleted ? 'Archive' : 'My Tasks'}</h2>
            <span className="badge badge-lg">{visibleTasks.length} items</span>
          </div>

          <CoreStack spacing={4}>
            {visibleTasks.map((task) => (
              <CoreItem key={task.id}>
                <TaskItem {...task} />
              </CoreItem>
            ))}

            {visibleTasks.length === 0 && (
              <div className="hero py-10 bg-base-200 rounded-box">
                <div className="hero-content text-center">
                  <div className="max-w-md opacity-50">
                    <h1 className="text-2xl font-bold">All caught up</h1>
                  </div>
                </div>
              </div>
            )}
          </CoreStack>

        </div>
      </CoreItem>
    </CoreStack>
  );
}