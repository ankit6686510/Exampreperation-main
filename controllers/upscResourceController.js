const UpscResource = require('../models/UpscResource');

// Get all UPSC resources with filters
const getUpscResources = async (req, res) => {
  try {
    const { category, subject, status, priority, search } = req.query;
    const filters = { isActive: true };
    
    if (category) filters.category = category;
    if (subject) filters.subject = new RegExp(subject, 'i');
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (search) {
      filters.$or = [
        { title: new RegExp(search, 'i') },
        { author: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }
    
    const resources = await UpscResource.getResourcesWithStats(req.user.id, filters);
    
    res.json({
      success: true,
      data: resources,
    });
  } catch (error) {
    console.error('Get UPSC resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch UPSC resources',
    });
  }
};

// Get subject-wise statistics
const getSubjectStats = async (req, res) => {
  try {
    const stats = await UpscResource.getSubjectStats(req.user.id);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get subject stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subject statistics',
    });
  }
};

// Get single UPSC resource
const getUpscResource = async (req, res) => {
  try {
    const resource = await UpscResource.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true,
    });
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'UPSC resource not found',
      });
    }
    
    res.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    console.error('Get UPSC resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch UPSC resource',
    });
  }
};

// Create UPSC resource
const createUpscResource = async (req, res) => {
  try {
    const {
      category,
      subject,
      title,
      author,
      publisher,
      edition,
      chapters,
      priority,
      examRelevance,
      tags,
      description,
      url,
      totalPages,
      estimatedHours,
    } = req.body;
    
    const resource = new UpscResource({
      user: req.user.id,
      category,
      subject,
      title,
      author,
      publisher,
      edition,
      chapters: chapters || [],
      priority: priority || 'Recommended',
      examRelevance: examRelevance || [],
      tags: tags || [],
      description,
      url,
      totalPages,
      estimatedHours: estimatedHours || 0,
    });
    
    await resource.save();
    
    res.status(201).json({
      success: true,
      data: resource,
      message: 'UPSC resource created successfully',
    });
  } catch (error) {
    console.error('Create UPSC resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create UPSC resource',
    });
  }
};

// Update UPSC resource
const updateUpscResource = async (req, res) => {
  try {
    const resource = await UpscResource.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true,
    });
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'UPSC resource not found',
      });
    }
    
    // Update fields
    const allowedFields = [
      'category', 'subject', 'title', 'author', 'publisher', 'edition',
      'chapters', 'priority', 'examRelevance', 'tags', 'description',
      'url', 'totalPages', 'estimatedHours', 'actualHours', 'status',
      'rating', 'review', 'lastReadAt'
    ];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        resource[field] = req.body[field];
      }
    });
    
    await resource.save();
    
    res.json({
      success: true,
      data: resource,
      message: 'UPSC resource updated successfully',
    });
  } catch (error) {
    console.error('Update UPSC resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update UPSC resource',
    });
  }
};

// Update chapter status
const updateChapterStatus = async (req, res) => {
  try {
    const { chapterId, completed, timeSpent, notes } = req.body;
    
    const resource = await UpscResource.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true,
    });
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'UPSC resource not found',
      });
    }
    
    const chapter = resource.chapters.id(chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found',
      });
    }
    
    if (completed !== undefined) {
      chapter.completed = completed;
      if (completed) {
        chapter.completedAt = new Date();
      } else {
        chapter.completedAt = undefined;
      }
    }
    
    if (timeSpent !== undefined) {
      chapter.timeSpent = (chapter.timeSpent || 0) + timeSpent;
    }
    
    if (notes !== undefined) {
      chapter.notes = notes;
    }
    
    resource.lastReadAt = new Date();
    await resource.save();
    
    res.json({
      success: true,
      data: resource,
      message: 'Chapter updated successfully',
    });
  } catch (error) {
    console.error('Update chapter status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chapter status',
    });
  }
};

// Delete UPSC resource (soft delete)
const deleteUpscResource = async (req, res) => {
  try {
    const resource = await UpscResource.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true,
    });
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'UPSC resource not found',
      });
    }
    
    resource.isActive = false;
    await resource.save();
    
    res.json({
      success: true,
      message: 'UPSC resource deleted successfully',
    });
  } catch (error) {
    console.error('Delete UPSC resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete UPSC resource',
    });
  }
};

// Import UPSC template
const importUpscTemplate = async (req, res) => {
  try {
    const { templateCategory } = req.body;
    
    if (!templateCategory) {
      return res.status(400).json({
        success: false,
        message: 'Template category is required',
      });
    }
    
    // Get template resources
    const templates = await UpscResource.find({
      isTemplate: true,
      templateCategory,
      isActive: true,
    });
    
    if (templates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No templates found for this category',
      });
    }
    
    // Create user resources from templates
    const userResources = templates.map(template => ({
      user: req.user.id,
      category: template.category,
      subject: template.subject,
      title: template.title,
      author: template.author,
      publisher: template.publisher,
      edition: template.edition,
      chapters: template.chapters.map(chapter => ({
        name: chapter.name,
        pageRange: chapter.pageRange,
        order: chapter.order,
      })),
      priority: template.priority,
      examRelevance: template.examRelevance,
      tags: template.tags,
      description: template.description,
      url: template.url,
      totalPages: template.totalPages,
      estimatedHours: template.estimatedHours,
    }));
    
    const createdResources = await UpscResource.insertMany(userResources);
    
    res.json({
      success: true,
      data: createdResources,
      message: `${createdResources.length} resources imported successfully`,
    });
  } catch (error) {
    console.error('Import UPSC template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import UPSC template',
    });
  }
};

// Get available templates
const getTemplates = async (req, res) => {
  try {
    const { templateCategory } = req.query;
    const filters = { isTemplate: true, isActive: true };
    
    if (templateCategory) {
      filters.templateCategory = templateCategory;
    }
    
    const templates = await UpscResource.find(filters)
      .select('templateCategory subject title author description examRelevance priority')
      .sort({ templateCategory: 1, subject: 1, priority: 1 });
    
    // Group by template category
    const groupedTemplates = templates.reduce((acc, template) => {
      const category = template.templateCategory;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(template);
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: groupedTemplates,
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
    });
  }
};

// Bulk update resources
const bulkUpdateResources = async (req, res) => {
  try {
    const { resourceIds, action, actionData } = req.body;
    
    if (!resourceIds || !Array.isArray(resourceIds) || resourceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Resource IDs array is required',
      });
    }
    
    const updateData = {};
    
    switch (action) {
      case 'set_priority':
        if (!actionData?.priority) {
          return res.status(400).json({
            success: false,
            message: 'Priority is required for set_priority action',
          });
        }
        updateData.priority = actionData.priority;
        break;
      case 'mark_completed':
        updateData.status = 'Completed';
        updateData.completedAt = new Date();
        break;
      case 'add_tags':
        if (!actionData?.tags || !Array.isArray(actionData.tags)) {
          return res.status(400).json({
            success: false,
            message: 'Tags array is required for add_tags action',
          });
        }
        updateData.$addToSet = { tags: { $each: actionData.tags } };
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action',
        });
    }
    
    const result = await UpscResource.updateMany(
      {
        _id: { $in: resourceIds },
        user: req.user.id,
        isActive: true,
      },
      updateData
    );
    
    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
      },
      message: `${result.modifiedCount} resources updated successfully`,
    });
  } catch (error) {
    console.error('Bulk update resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update resources',
    });
  }
};

module.exports = {
  getUpscResources,
  getSubjectStats,
  getUpscResource,
  createUpscResource,
  updateUpscResource,
  updateChapterStatus,
  deleteUpscResource,
  importUpscTemplate,
  getTemplates,
  bulkUpdateResources,
};
