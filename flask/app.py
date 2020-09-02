#!/usr/bin/python3

from flask import Flask, escape, request
from flask import render_template, send_from_directory
import psycopg2,json
import configparser

app = Flask(__name__)

## read_configmap: import data from config.ini
def read_configmap(config, section):
    dict1 = {}
    options = config.options(section)
    for option in options:
        try:
            dict1[option] = config.get(section,option)
        except:
            print("Exception on %s!" % option)
            exit(1)
    return dict1


def get_conn_str():
    config = configparser.ConfigParser()
    config.read('./config.ini')
    dbs = read_configmap(config, 'Database')
    conn_str = "host=%s dbname=%s port=%s user=%s password=%s" \
             % (dbs['hostname'], dbs['dbname'], dbs['port'], \
                dbs['username'], dbs['password'])
    return(conn_str)

def get_cursor():
    try:
        conn_str = get_conn_str()
        conn = psycopg2.connect(conn_str);
        curs = conn.cursor()
    except Exception as e:
        print('Connection Error: %s' % (e))
        return
    return curs

def exec_query(query,params=()):
    print(query)
    curs = get_cursor()
    curs.execute('set search_path to yacht,public')
    curs.execute(query,params)
    r = curs.fetchall()
    curs.close()
    return r

@app.route('/')
def index():
    return render_template("index.html")

########################################
##   Postgres API                     ##
########################################

@app.route('/get_bar')
def get_bar():
	query = '''
with t as
(select node_name as name,
       count(*)as count
  from nodes n
  join node_map nm
    on n.id = nm.source
 where node_type = 'performer'
 group by node_name
 order by count(*) desc
 limit 25)
select jsonb_agg(jsonb_build_object('name',name,'count',count))
  from t;
	'''
	r = exec_query(query)
	return json.dumps(r[0][0])

@app.route('/get_network')
def get_network():
    query = '''
with map as (
select nm.id,
       nm.source,
       a.node_name as source_name,
       a.node_type as source_group,
       nm.target,
       b.node_name as target_name,
       b.node_type as target_group,
       nm.cost
  from (select * from pgr_kruskal('select id, source, target, cost from node_map order by id') ) pgrk
  join node_map nm
    on pgrk.edge = nm.id
  join nodes a
    on nm.source = a.id
  join nodes b
    on nm.target = b.id
),
links as  (
    select json_agg(jsonb_build_object('source',source_name,'target',target_name, 'value', cost)) as ln
      from map
),
nodes as (
    select json_agg(jsonb_build_object('id', name, 'group', grp)) nn from (
        select distinct source_name as name, source_group as grp from map
        UNION ALL
        select  distinct target_name as name, target_group as grp from map) foo
)
select jsonb_build_object('links', ln, 'nodes', nn) from links,nodes
    '''
    r = exec_query(query)
    return json.dumps(r[0][0])

@app.route('/get_by_name/<node_name>/<int:degrees>')
def get_by_name(node_name,degrees):
    query = 'select yre_get_force_json_by_name(%s, %s)'
    params = (node_name, degrees)
    r = exec_query(query, params)
    return json.dumps(r[0][0])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
