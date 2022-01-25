import os
import json
import csv

from os import listdir
from os.path import isfile, join

# Constants
BASE_DATASET_DIR = 'dataset'
BASE_TASKS_DIR = join(BASE_DATASET_DIR, 'tasks_json')

# Read each task
all_descriptions = []
task_fns = [f for f in listdir(BASE_TASKS_DIR) if isfile(join(BASE_TASKS_DIR, f))]
for task_fn in task_fns:
    task_fp = join(BASE_TASKS_DIR, task_fn)
    larc_id = int(task_fn[:task_fn.find('.json')])
    with open(task_fp, 'r') as f:
        data = json.loads(f.read())
    task_name, descriptions = data['name'], data['descriptions']
    for d in descriptions.values():
            nb_success_builds = 0
            for b in d['builds'].values():
                if b['success']:
                    nb_success_builds += 1
            # Extract descriptions
            see_description = d['see_description'].replace('...', ' ', 1).replace('  ', ' ')
            do_description = d['do_description'].replace('...', ' ', 1).replace('  ', ' ')
            grid_description = d['grid_description'].replace('...', ' ', 1).replace('  ', ' ')
            # Update all_descriptions
            all_descriptions.append({
                'larc_id': larc_id,
                'task_name': task_name[:task_name.find('.json')],
                'see_description': see_description,
                'grid_description': grid_description,
                'do_description': do_description,
                'succeeded_verification': d['succeeded_verification'],
                'total_nb_builds': len(d['builds']),
                'nb_successful_builds': nb_success_builds
            })
print('len(all_descriptions): {}'.format(len(all_descriptions)))

fields = ['larc_id', 'task_name', 'see_description', 'grid_description',
          'do_description', 'succeeded_verification', 'total_nb_builds',
          'nb_successful_builds']
with open('larc_descriptions.csv', 'w+') as csvfile:
    # creating a csv writer object
    csvwriter = csv.writer(csvfile)

    # writing the fields
    csvwriter.writerow(fields)

    # writing the data rows
    for d in all_descriptions:
        row = [
            d['larc_id'],
            d['task_name'],
            d['see_description'],
            d['grid_description'],
            d['do_description'],
            d['succeeded_verification'],
            d['total_nb_builds'],
            d['nb_successful_builds']
        ]
        csvwriter.writerow(row)
