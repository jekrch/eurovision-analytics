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
