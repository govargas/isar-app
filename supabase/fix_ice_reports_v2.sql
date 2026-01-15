UPDATE ice_reports ir SET source = l.name || ': Status uppdaterad' FROM lakes l WHERE ir.lake_id = l.id AND ir.source LIKE '%Status uppdaterad%';


