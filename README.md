# Yacht Rock Explorer
The Yacht Rock Explorer uses postgres, pgrouting and d3 th represent a network diagram of the connectivity of the Yacht Rock Genrre.

## Data
Data is provided as a csv file and the sql required to create the appropriate graph structures.

Data was gathered from [Yacht or Nyacht](https://www.yachtornyacht.com/). Throw them some love, the work they do is invaluable. No one else does what they do . . nor can they.

## Web Service

No attempt is made to provide a 'full working download'.

The flask directory includes the appropriate index.html, site.css, and site.js, all other components (d3, boostrap, python libraries) need to be installed and extracted to the appropriate locations.

## Requirements

* d3 v5 (untested with v6) [d3 homepage](https://d3js.org)
* bootstrap (tested with 4.4.1) [Get Boostrap](https://getbootstrap.com/)
* Python3 and appropriate modules

## Installtion & Configuration
* Update example\_config.ini to the values for your database. (See [psycopg\_tmpl](https://github.com/scurvyjtp/psycopg_tmpl) for more (or less) info)
* Rename to config.ini.
* Run the scripts in the SQL directory.
