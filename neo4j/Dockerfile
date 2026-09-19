FROM neo4j:5.26.9

ENV NEO4J_ACCEPT_LICENSE_AGREEMENT=yes \
    NEO4J_apoc_export_file_enabled=true \
    NEO4J_apoc_import_file_enabled=true \
    NEO4J_apoc_import_file_use__neo4j__config=true \
    NEO4J_PLUGINS='["apoc-extended", "graph-data-science"]' \
    NEO4J_dbms_security_procedures_unrestricted=apoc.* \
    NEO4J_dbms_logs_debug_level=DEBUG

RUN apt-get update && \
    apt-get install -y wget && \
    wget -P /var/lib/neo4j/plugins/ https://jdbc.postgresql.org/download/postgresql-42.5.0.jar && \
    chown -R neo4j:neo4j /var/lib/neo4j/plugins/ && \
    echo "dbms.security.auth_enabled=false" >> /var/lib/neo4j/conf/neo4j.conf

COPY ./migrations /migrations

CMD ["sh", "-c", "neo4j start; \
    echo 'Waiting for Neo4j to be available...'; \
    until wget -q --spider http://localhost:7474; do sleep 5; done; \
    echo 'Neo4j is available, waiting for Bolt...'; \
    tries=0; \
    until cypher-shell --non-interactive 'RETURN 1' >/dev/null 2>&1; do \
      tries=$((tries+1)); \
      if [ $tries -ge 30 ]; then echo 'Bolt never became available; check /logs/debug.log (out of memory?)'; exit 1; fi; \
      sleep 5; \
    done; \
    echo 'Running migrations...'; \
    for f in /migrations/*.cypher; do \
      echo \"Running $f...\"; \
      if ! cypher-shell --non-interactive --format plain --file $f; then \
        echo \"Migration FAILED: $f\"; exit 1; \
      fi; \
    done; \
    echo 'Migrations completed successfully.'; \
    tail -f /dev/null;"]