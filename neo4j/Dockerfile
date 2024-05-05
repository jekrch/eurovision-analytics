FROM neo4j:5.19

ENV NEO4J_ACCEPT_LICENSE_AGREEMENT=yes \
    NEO4J_AUTH=neo4j/unitedbymusic \
    NEO4J_apoc_export_file_enabled=true \
    NEO4J_apoc_import_file_enabled=true \
    NEO4J_apoc_import_file_use__neo4j__config=true \
    NEO4J_PLUGINS='["apoc-extended", "graph-data-science"]' \
    NEO4J_dbms_security_procedures_unrestricted=apoc.* \
    NEO4J_dbms_logs_debug_level=DEBUG

RUN apt-get update && \
    apt-get install -y wget && \
    wget -P /var/lib/neo4j/plugins/ https://jdbc.postgresql.org/download/postgresql-42.5.0.jar && \
    chown -R neo4j:neo4j /var/lib/neo4j/plugins/

COPY ./migrations /migrations

CMD ["sh", "-c", "neo4j start; \
echo 'Waiting for Neo4j to be available...'; \
until wget -q --spider http://localhost:7474; do sleep 5; done; \
echo 'Neo4j is available, waiting for 5 seconds before running migrations...'; \
sleep 5; \
echo 'Setting db credentials'; \
cypher-shell -u neo4j -p neo4j --database system \"ALTER CURRENT USER SET PASSWORD FROM 'neo4j' TO 'unitedbymusic'\"; \
sleep 5; \
echo 'Running migrations...'; \
cypher-shell -u neo4j -p unitedbymusic --non-interactive --format plain --file /migrations/V1__import_data.cypher; \
echo 'Migration completed successfully.'; \
tail -f /dev/null;"]