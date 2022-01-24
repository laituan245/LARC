import os
import json
import csv

from os import listdir
from os.path import isfile, join

# Constants
BASE_DATASET_DIR = 'dataset'
BASE_TASKS_DIR = join(BASE_DATASET_DIR, 'tasks_json')

# Read each task
tasks, nb_tasks, nb_extracted = [], 0, 0
task_fns = [f for f in listdir(BASE_TASKS_DIR) if isfile(join(BASE_TASKS_DIR, f))]
for task_fn in task_fns:
    nb_tasks += 1
    task_fp = join(BASE_TASKS_DIR, task_fn)
    larc_id = int(task_fn[:task_fn.find('.json')])
    if larc_id == 396: continue # Noisy case
    with open(task_fp, 'r') as f:
        data = json.loads(f.read())
    task_name, descriptions = data['name'], data['descriptions']
    for d in descriptions.values():
        if d['succeeded_verification']:
            has_success_build = False
            for b in d['builds'].values():
                if b['success']:
                    has_success_build = True
            if has_success_build:
                see_description = d['see_description'].replace('...', ' ', 1).replace('  ', ' ')
                do_description = d['do_description'].replace('...', ' ', 1).replace('  ', ' ')
                grid_description = d['grid_description'].replace('...', ' ', 1).replace('  ', ' ')
                nb_extracted += 1
                # Update tasks
                tasks.append({
                    'larc_id': larc_id,
                    'task_name': task_name,
                    'see_description': see_description,
                    'grid_description': grid_description,
                    'do_description': do_description,
                })
                break
print(f'Number tasks: {nb_tasks}')
print(f'Number tasks with sucessful descriptions: {nb_extracted}')
print('len(tasks): {}'.format(len(tasks)))

fields = ['larc_id', 'task_name', 'see_description', 'grid_description', 'do_description']
with open('tasks_with_descriptions.csv', 'w+') as csvfile:
    # creating a csv writer object
    csvwriter = csv.writer(csvfile)

    # writing the fields
    csvwriter.writerow(fields)

    # writing the data rows
    for task in tasks:
        row = [
            task['larc_id'],
            task['task_name'],
            task['see_description'],
            task['grid_description'],
            task['do_description']
        ]
        csvwriter.writerow(row)
