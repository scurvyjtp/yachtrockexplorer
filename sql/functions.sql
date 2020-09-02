
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
