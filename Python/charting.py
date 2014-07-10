'''
Created on May 25, 2014

@author: Colin
'''
import pandas as pd
import numpy as np
import os

pathDir='F:/CFB Data/'

def get_data(pathDir):
    chartDB=pd.read_excel(pathDir+'2013StudyHallChartingMasterV2.xlsx','MASTER',index_col='Id')
    return chartDB
    

def clean_data(chartDB): #Adds fields, cleans known data issues
    chartDB['Defense']=''
    chartDB.loc[chartDB['Home']==chartDB['Offense'],'Defense']=chartDB['Away']
    chartDB.loc[chartDB['Away']==chartDB['Offense'],'Defense']=chartDB['Home']
    chartDB['Gun'].fillna('Under Center',inplace=True)
    chartDB.loc[chartDB['Clock'].astype(str).map(len)<3,'Clock']=np.NaN
    chartDB.loc[(chartDB['Clock'].astype(str).map(len)>3)&
                (chartDB['Clock'].astype(str).map(len)<8),'Clock']=np.NaN
    chartDB.loc[chartDB['Clock']==849,'Clock']=np.NaN #Single exception that prevents conversion to timestamp
    
    gun_map={'Under Center':0,'Pistol':0.5,'Shotgun':1,'Wildcat':0.5}
    chartDB['GunMap']=chartDB['Gun'].map(gun_map)
    
    

def garbage_time_filter(chartDB):
    chartDB['SD']=abs(chartDB['AS']-chartDB['HS'])
    filterDB=chartDB[((chartDB['SD']<=28)&(chartDB['QTR']==1))|
                     ((chartDB['SD']<=24)&(chartDB['QTR']==2))|
                     ((chartDB['SD']<=21)&(chartDB['QTR']==3))|
                     ((chartDB['SD']<=16)&(chartDB['QTR']==4))]
    del chartDB['SD']
    return filterDB
    
def min_games_filter(chartDB): #Filters charting data to teams that have a minimum number of games.  Returns two DataFrames: all offensive plays for those teams, and all defensive plays for those teams.
    minNumGames=5
    uniques=chartDB.drop_duplicates(cols=['Game'])
    teams=pd.concat([uniques['Home'],uniques['Away']],ignore_index=True)
    games=teams.value_counts()
    filtered_teams=games[games>=minNumGames].index.values.tolist()
    offenseDB=chartDB[chartDB['Offense'].isin(filtered_teams)]
    defenseDB=chartDB[chartDB['Defense'].isin(filtered_teams)]  
    return offenseDB, defenseDB


def group_offensive_plays(offenseDB):
    grouper=pd.pivot_table(data=offenseDB,values=['Down'],cols=['Offense'],rows=['# of Backs','# Wide','Gun'],aggfunc='count',fill_value=0)
    exportDB=grouper['Down']
    exportDB['Total']=exportDB.sum(axis=1)
    exportDB=exportDB[exportDB['Total']>9]
    del exportDB['Total']
    return grouper
    exportDB.stack().to_csv(pathDir+'stacked_pivot.csv')

def calculate_formation_distance(offenseDB):
    offenseDB['EucDistance']=0
    teams=offenseDB['Offense'].drop_duplicates().values.tolist()
    for team in offenseDB['Offense'].drop_duplicates().values.tolist():
        teamDB=offenseDB[offenseDB['Offense']==team]
        for index,row in teamDB.iterrows():
            vectorDistance=((row['# of Backs']-teamDB['# of Backs'])/3)**2+((row['# Wide']-teamDB['# Wide'])/3)**2+((row['GunMap']-teamDB['GunMap'])/1)**2
            offenseDB.loc[index,'EucDistance']=vectorDistance.mean()

    teamDistances=pd.DataFrame(index=teams)
    teamDistances['Distance']=0
    for team in teams:
        teamDB=offenseDB[offenseDB['Offense']==team]
        teamDistances.loc[team,'Distance']=teamDB['EucDistance'].mean()

