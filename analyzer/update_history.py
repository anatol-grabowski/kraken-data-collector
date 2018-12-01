import pandas as pd
import os
import sys

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

def read_new_df(json):
    df = pd.read_json(json)
    cols = ['time', 'open', 'high', 'low', 'close', 'vwap', 'volume', 'count']
    new_names = dict(zip(df.columns, cols))
    df.rename(columns=new_names, inplace=True)
    return df

def main():
    hist_file = sys.argv[1]

    json = sys.stdin.read()
    new_df = read_new_df(json)

    try:
        df = pd.read_csv(hist_file)
    except FileNotFoundError:
        df = None

    # df = new_df
    df = join_dfs(df, new_df)

    filedir = os.path.dirname(hist_file)
    os.makedirs(filedir, exist_ok=True)
    df.set_index(['time'], inplace=True)
    print(hist_file)
    print(len(df))
    df.to_csv(hist_file)

main()