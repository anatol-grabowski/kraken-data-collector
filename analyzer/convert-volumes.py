import csv
import json
import numpy as np

def convert_volumes_csv(filepath):
    outfiles = {}

    with open(filepath, 'r') as file:
        csv_reader = csv.reader(file)
        header = next(csv_reader)
        n = 100
        outheader = ','.join([
            'timestamp',
            *['p-' + str(i) for i in range(n, 0, -1)],
            *['p' + str(i + 1) for i in range(n)],
            *['v-' + str(i) for i in range(n, 0, -1)],
            *['v' + str(i + 1) for i in range(n)],
        ])

        for i, row in enumerate(csv_reader):
            ticker, volumes, timestamp = row
            volumes = json.loads(volumes)
            ps = [
                *[r[0] for r in volumes['bids'][::-1]],
                *[r[0] for r in volumes['asks']],
            ]
            bids_vs = np.array([r[1] for r in volumes['bids']], dtype=float).cumsum()[::-1]
            asks_vs = np.array([r[1] for r in volumes['asks']], dtype=float).cumsum()
            vs = [
                *bids_vs,
                *asks_vs,
            ]
            outrow = ','.join([
                timestamp,
                *['{:.6f}'.format(float(p)) for p in ps],
                *['{:.4f}'.format(v) for v in vs],
            ])
            if ticker not in outfiles:
                outfiles[ticker] = open('volumes-' + ticker + '.csv', 'w+')
                outfiles[ticker].write(outheader + '\n')
            outfile = outfiles[ticker]
            outfile.write(outrow + '\n')
            # print(ticker, timestamp, vs[:4], ps[:4], len(ps))

convert_volumes_csv(filepath)


def fix_new_lines():
    o = open('o.csv', 'w+')
    import re
    f = open('/home/tot/_tot/proj/trading/kraken-data-collector/aws/volumes-to-dynamo-lambda/volumes.csv', 'r')
    for line in f:
      l = re.sub(r'(\d)([A-Za-z])', r'\1\n\2', line)
      o.write(l)


def main():
    filepath = 'volumes-XBTUSD.csv'
