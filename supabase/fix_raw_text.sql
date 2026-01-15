UPDATE ice_reports ir SET raw_text = l.name || ': Status uppdaterad' FROM lakes l WHERE ir.lake_id = l.id;


