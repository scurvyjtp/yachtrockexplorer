
-- yre_get_force_json_by_name(text,int)
--  Input:
--    name: node_name to search from
--    degrees: how many degrees of separation to search
--
--  This function wraps a long query for easier reading. It
--  returns a json object compatibile with d3's force diagram.
--  (i.e. a json object containing an array of nodes and links)

CREATE OR REPLACE FUNCTION
    yre_get_force_json_by_name(name_in text, degrees_in int)
    returns jsonb
    as $_$
BEGIN

RETURN
(with map as (
select nm.id,
       nm.source,
       a.node_name as source_name,
       a.node_type as source_group,
       nm.target,
       b.node_name as target_name,
       b.node_type as target_group,
       nm.cost
  from (select * from pgr_drivingdistance('select id, target as source, source as target, 1 as cost from node_map'::text,
            (select id from nodes where node_name = name_in), degrees_in)) pgrk
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
        select distinct * from (
        select source_name as name, source_group as grp from map
        UNION ALL
        select  target_name as name, target_group as grp from map) bar ) foo
)
select jsonb_build_object('links', ln, 'nodes', nn) from links,nodes);

END;
$_$ LANGUAGE 'plpgsql';

-- yre_get_topx(int)
--  Input:
--    limit: how many records to return
--
--  Return a jsonb of the top x Yacht Rockers by song apperances
--  for a d3 bar chart. 

CREATE OR REPLACE FUNCTION
    yre_get_topx(limit_in int)
    returns jsonb
    as $_$
BEGIN

RETURN
(with t as
(select node_name as name,
       count(*)as count
  from nodes n
  join node_map nm
    on n.id = nm.source
 where node_type = 'performer'
 group by node_name
 order by count(*) desc
 limit limit_in)
select jsonb_agg(jsonb_build_object('name',name,'count',count))
  from t);

END;
$_$ LANGUAGE 'plpgsql';


-- yre_get_minimal_network()
--
--  Returns a jsonb of the minimal spanning forest of all nodes 
--  in the yachtrock node map


CREATE OR REPLACE FUNCTION yre_get_minimal_network()
returns jsonb as $_$
BEGIN

RETURN
(with map as (
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
        select distinct * from (
        select distinct source_name as name, source_group as grp from map
        UNION ALL
        select  distinct target_name as name, target_group as grp from map) bar ) foo
)
select jsonb_build_object('links', ln, 'nodes', nn) from links,nodes);

END;
$_$ LANGUAGE 'plpgsql';



-- yre_get_full_network()
--
--  Returns a jsonb of the minimal spanning forest of all nodes 
--  in the yachtrock node map


CREATE OR REPLACE FUNCTION yre_get_full_network()
returns jsonb as $_$
BEGIN

RETURN
(with map as (
select nm.id,
       nm.source,
       a.node_name as source_name,
       a.node_type as source_group,
       nm.target,
       b.node_name as target_name,
       b.node_type as target_group,
       nm.cost
  from node_map nm
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
        select distinct * from (
        select distinct source_name as name, source_group as grp from map
        UNION ALL
        select  distinct target_name as name, target_group as grp from map) bar ) foo
)
select jsonb_build_object('links', ln, 'nodes', nn) from links,nodes);

END;
$_$ LANGUAGE 'plpgsql';
