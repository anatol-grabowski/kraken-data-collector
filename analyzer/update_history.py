import pandas as pd
import os
import sys
import json

def join_dfs(df1, df2):
    # print(df1)
    # print(df2)
    if df1 is None:
        return df2
    if df2 is None:
        return df1
    df = pd.concat([df1, df2], sort=False)
    df.drop_duplicates(subset=['time'], keep='last', inplace=True)
    df.sort_values(by=['time'], inplace=True)

    # print(df)
    return df

def read_new_df(data):
    df = pd.read_json(data)
    cols = ['time', 'open', 'high', 'low', 'close', 'vwap', 'volume', 'count']
    new_names = dict(zip(df.columns, cols))
    df.rename(columns=new_names, inplace=True)
    return df

def update_bars(data, filepath):
    new_df = read_new_df(data)

    try:
        df = pd.read_csv(filepath)
    except FileNotFoundError:
        df = None

    # df = new_df
    df = join_dfs(df, new_df)

    filedir = os.path.dirname(filepath)
    os.makedirs(filedir, exist_ok=True)
    df.set_index(['time'], inplace=True)
    print(len(df))
    df.to_csv(filepath)

def get_depth_data(data, count=None):
    data = json.loads(data)
    time = data['time']
    asks = pd.DataFrame(data['asks']).iloc[:count]
    bids = pd.DataFrame(data['bids']).iloc[:count]
    prices = [p for p in bids[0][::-1]] + [p for p in asks[0]]
    volumes = [v for v in bids[1][::-1]] + [v for v in asks[1]]
    return time, prices, volumes

def update_depth(data, filepath):
    time, prices, volumes = get_depth_data(data, count=None)
    line = f'{time},{",".join(prices)},{",".join(volumes)}\n'
    f = open(filepath, 'a')
    f.write(line)
    print(f.tell())

def main():
    command = sys.argv[1]
    filepath = sys.argv[2]
    data = sys.stdin.read()
    if (command == 'bars'):
        update_bars(data, filepath)
    elif (command == 'depth'):
        update_depth(data, filepath)
    else:
        print('unknown command', command)
        exit(1)

main()